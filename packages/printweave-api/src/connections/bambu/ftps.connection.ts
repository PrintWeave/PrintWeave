import {Client} from 'basic-ftp';
import path from "path";
import {Readable} from "node:stream";

export class FtpsBambuConnection {

    ip: string;
    code: string;

    client: Client;

    constructor(ip: string, code: string) {
        this.ip = ip;
        this.code = code;
    }

    async connect(): Promise<FtpsBambuConnection> {
        this.client = new Client()

        try {
            await this.client.access({
                host: this.ip,
                user: 'bblp',
                password: this.code,
                port: 990,
                secure: 'implicit',
                secureOptions: {
                    timeout: 5 * 1000,
                    sessionTimeout: 30 * 60 * 1000,
                    rejectUnauthorized: false,
                },
            })
        }
        catch(err) {
            console.log(err)
        }

        return this;
    }

    disconnect() {
        this.client.close()
    }

    async uploadFile(localPath: string, remotePath: string): Promise<void> {
        await this.client.cd('/')

        const allDirs = path.dirname(remotePath).split(path.sep)

        for (const dir of allDirs) {
            if (dir === '') {
                continue
            }
            await this.client.ensureDir(dir)
        }

        await this.client.uploadFrom(localPath, path.basename(remotePath))
    }

    async uploadFileFromReadable(readStream: Readable, remotePath: string): Promise<void> {
        await this.client.cd('/')

        const allDirs = path.dirname(remotePath).split('/')

        for (const dir of allDirs) {
            if (dir === '') {
                continue
            }
            await this.client.ensureDir(dir)
        }

        await this.client.uploadFrom(readStream, path.basename(remotePath))
    }

}
