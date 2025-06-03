export abstract class VideoProcessor {
    abstract getSingleImage(): Promise<Buffer>;
    abstract getVideoFrames(stream: VideoStream): Promise<void>;
}

export interface VideoStream {
    addFrame(frame: Buffer): void;
    endStream(): void;
    on(event: 'end', callback: () => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    on(event: 'frame', callback: (frame: Buffer) => void): void;
}
