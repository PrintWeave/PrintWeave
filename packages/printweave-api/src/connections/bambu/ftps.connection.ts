import {Client} from 'basic-ftp';

export class FtpsBambuConnection {

    ip: string;
    code: string;

    client: Client;

    constructor(ip: string, code: string) {
        this.ip = ip;
        this.code = code;
    }

    async connect(): Promise<FtpsBambuConnection> {
/*
        this.client = new Client();

        this.client.ftp.verbose = true;

        console.log(await this.client.access({
            host: this.ip,
            user: 'bblp',
            password: this.code,
            secure: true,
            port: 990,
            secureOptions: {
                rejectUnauthorized: false
            }
        }));

        console.log(await this.client.features())

        console.log(await this.client.ensureDir('printweave/models'))
        console.log(await this.client.ensureDir('printweave/images'))

        console.log(await this.client.list())
*/

        const client = new Client()
        client.ftp.verbose = true
        try {
            await client.access({
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

            console.log(await client.list())
        }
        catch(err) {
            console.log(err)
        }
        client.close()

        // Connect to the FTPS server
        return this;
    }

}
