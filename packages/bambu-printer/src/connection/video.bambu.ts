import {EventEmitter} from "events";
import tls from "tls";
import {VideoProcessor, VideoStream} from "@printweave/models/dist/models/video.model.js";
import PrinterPlugin from "../main.js";

interface FrameHeader {
    payloadSize: number;
    itrack: number;
    flags: number;
    reserved: number;
}

export class BambuVideoProcessor extends VideoProcessor {
    private printerIp: string;
    private accessCode: string;
    private socket: tls.TLSSocket | null = null;
    private isConnected: boolean = false;
    private pendingData: Buffer = Buffer.alloc(0);
    private expectingHeader: boolean = true;
    private currentFrameSize: number = 0;
    private currentFrameData: Buffer = Buffer.alloc(0);
    private lastFrameTime: number = Date.now();
    private fps: number = 0;
    private frameEventEmitter = new EventEmitter();

    constructor(printerIp: string, accessCode: string) {
        super();
        this.printerIp = printerIp;
        this.accessCode = accessCode;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            PrinterPlugin.logger.info(`Connecting to printer at ${this.printerIp}:6000...`);

            this.socket = tls.connect(6000, this.printerIp, {
                rejectUnauthorized: false
            }, () => {
                PrinterPlugin.logger.info('TLS connection established');
                this.authenticate().then(resolve).catch(reject);
            });

            this.socket.on('data', (data: Buffer) => {
                this.handleData(data);
            });

            this.socket.on('error', (error: Error) => {
                PrinterPlugin.logger.error('Socket error:', error);
                reject(error);
            });

            this.socket.on('close', () => {
                PrinterPlugin.logger.info('Connection closed');
                this.isConnected = false;
                this.cleanup();
            });
        });
    }

    private async authenticate(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not available'));
                return;
            }

            PrinterPlugin.logger.info('Sending authentication packet...');

            const authPacket = this.createAuthPacket('bblp', this.accessCode);
            this.socket.write(authPacket);

            setTimeout(() => {
                this.isConnected = true;
                PrinterPlugin.logger.info('Authentication successful, starting frame reception...');
                resolve();
            }, 1000);
        });
    }

    private createAuthPacket(username: string, password: string): Buffer {
        const packet = Buffer.alloc(80);
        let offset = 0;

        packet.writeUInt32LE(0x40, offset);
        offset += 4;

        packet.writeUInt32LE(0x3000, offset);
        offset += 4;

        packet.writeUInt32LE(0, offset);
        offset += 4;

        packet.writeUInt32LE(0, offset);
        offset += 4;

        const usernameBuffer = Buffer.from(username, 'ascii');
        usernameBuffer.copy(packet, offset, 0, Math.min(32, usernameBuffer.length));
        offset += 32;

        const passwordBuffer = Buffer.from(password, 'ascii');
        passwordBuffer.copy(packet, offset, 0, Math.min(32, passwordBuffer.length));

        PrinterPlugin.logger.info('Auth packet created');
        return packet;
    }

    private handleData(data: Buffer): void {
        this.pendingData = Buffer.concat([this.pendingData, data]);

        while (this.pendingData.length > 0) {
            if (this.expectingHeader) {
                if (this.pendingData.length >= 16) {
                    const header = this.parseFrameHeader(this.pendingData.slice(0, 16));

                    this.currentFrameSize = header.payloadSize;
                    this.currentFrameData = Buffer.alloc(0);
                    this.expectingHeader = false;
                    this.pendingData = this.pendingData.slice(16);
                } else {
                    break;
                }
            } else {
                const remaining = this.currentFrameSize - this.currentFrameData.length;
                const available = Math.min(remaining, this.pendingData.length);

                const chunk = this.pendingData.slice(0, available);
                this.currentFrameData = Buffer.concat([this.currentFrameData, chunk]);
                this.pendingData = this.pendingData.slice(available);

                if (this.currentFrameData.length >= this.currentFrameSize) {
                    this.processJpegFrame(this.currentFrameData);
                    this.expectingHeader = true;
                }
            }
        }
    }

    private parseFrameHeader(headerData: Buffer): FrameHeader {
        return {
            payloadSize: headerData.readUInt32LE(0),
            itrack: headerData.readUInt32LE(4),
            flags: headerData.readUInt32LE(8),
            reserved: headerData.readUInt32LE(12)
        };
    }

    private processJpegFrame(jpegData: Buffer): void {
        // Verify JPEG magic bytes
        if (jpegData.length < 2 || jpegData[0] !== 0xFF || jpegData[1] !== 0xD8) {
            PrinterPlugin.logger.warn('Invalid JPEG start marker');
            return;
        }

        const endIndex = jpegData.length - 2;
        if (jpegData[endIndex] !== 0xFF || jpegData[endIndex + 1] !== 0xD9) {
            PrinterPlugin.logger.warn('Invalid JPEG end marker');
            return;
        }

        // Update statistics
        const now = Date.now();
        const timeDiff = (now - this.lastFrameTime) / 1000;
        this.fps = this.fps * 0.9 + (1 / timeDiff) * 0.1;
        this.lastFrameTime = now;

        this.frameEventEmitter.emit('frame', jpegData);
    }

    cleanup(): void {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.isConnected = false;
    }

    disconnect(): void {
        this.isConnected = false;
        this.cleanup();
    }

    get connected(): boolean { return this.isConnected; }
    get currentFps(): number { return this.fps; }

    private lastUnresolvedRequest = 0;

    async getSingleImage(): Promise<Buffer> {
        if (this.lastUnresolvedRequest > 0 && (Date.now() - this.lastUnresolvedRequest) < 5000) {
            PrinterPlugin.logger.warn('A request for a single image is already in progress. Please wait for it to complete.');
            return Promise.reject(new Error('Unresolved request in progress'));
        }

        this.lastUnresolvedRequest = Date.now();

        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for image'));
            }, 5000);

            this.frameEventEmitter.once('frame', (frame: Buffer) => {
                clearTimeout(timeout);
                this.disconnect()
                resolve(frame);
            });

            this.socket?.on('close', () => {
                this.cleanup();
            });
        });
    }

    async getVideoFrames(stream: VideoStream): Promise<void> {
        PrinterPlugin.logger.info('Starting video stream...');

        if (!this.isConnected) {
            await this.connect()
        }

        this.frameEventEmitter.on('frame', (frame: Buffer) => {
            stream.addFrame(frame);
        });

        this.socket?.on('close', () => {
            stream.endStream();
            this.disconnect();
        });

        stream.on('error', (error: Error) => {
            PrinterPlugin.logger.error('Stream error:', error);
            this.disconnect();
        });

        stream.on('end', () => {
            PrinterPlugin.logger.info('Stream ended');
            this.disconnect();
        });
    }
}
