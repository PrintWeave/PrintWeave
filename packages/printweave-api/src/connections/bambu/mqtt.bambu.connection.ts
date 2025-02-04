import {StopPrintCommand} from "./mqtt/StopPrintCommand.js";
import {OwnBambuClient} from "./mqtt/OwnBambuClient.js";
import {PausePrintCommand} from "./mqtt/PausePrintCommand.js";
import {ResumePrintCommand} from "./mqtt/ResumePrintCommand.js";
import {GetVersionCommand} from "bambu-node";
import {WebsocketsManager} from "../../websockets/manager.websockets.js";

export class MqttBambuConnection {

    client: OwnBambuClient;
    status: string = 'OFFLINE';
    printerId: number;

    constructor(ip: string, code: string, serial: string, printerId: number) {
        this.printerId = printerId;

        this.client = new OwnBambuClient({
            host: ip,
            accessToken: code,
            serialNumber: serial
        })

        this.client.on("printer:statusUpdate", (oldStatus, newStatus) => {
            console.log(`Printer with id: ${printerId} status changed from ${oldStatus} to ${newStatus}`);
            this.status = newStatus;
        })

        this.client.on("rawMessage", (topic, message) => {

            const data = JSON.parse(message.toString());

            const firstKey = Object.keys(data)[0];
            const topicName = `${firstKey}.${data[firstKey].command}`;

            WebsocketsManager.getWebsocketsManager().sendBambuMessage(this.printerId, topicName, data);
        });
    }

    async connect() {
        await this.client.connect();
    }
}
