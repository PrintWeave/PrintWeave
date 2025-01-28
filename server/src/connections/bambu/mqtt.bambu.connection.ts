import {StopPrintCommand} from "./mqtt/StopPrintCommand.js";
import {OwnBambuClient} from "./mqtt/OwnBambuClient.js";
import {PausePrintCommand} from "./mqtt/PausePrintCommand.js";
import {ResumePrintCommand} from "./mqtt/ResumePrintCommand.js";
import { GetVersionCommand } from "bambu-node";

export class MqttBambuConnection {

    client: OwnBambuClient;
    status: string = 'OFFLINE';

    constructor(ip: string, code: string, serial: string) {
        this.client = new OwnBambuClient({
            host: ip,
            accessToken: code,
            serialNumber: serial
        })

        this.client.on("printer:statusUpdate", (oldStatus, newStatus) => {
            console.log(`Printer status changed from ${oldStatus} to ${newStatus}`);
            this.status = newStatus;
        })
    }

    async connect() {
        await this.client.connect();
    }


    getVersion() {
        // send command info.get_version and wait for response
        return this.client.executeCommand(new GetVersionCommand());
    }

    async stopPrint() {
        return this.client.executeCommand(new StopPrintCommand());
    }

    async pausePrint() {
        return this.client.executeCommand(new PausePrintCommand());
    }

    async resumePrint() {
        return this.client.executeCommand(new ResumePrintCommand());
    }
}
