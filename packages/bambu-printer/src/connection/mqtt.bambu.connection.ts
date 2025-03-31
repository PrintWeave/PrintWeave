import {StopPrintCommand} from "./mqtt/StopPrintCommand.js";
import {OwnBambuClient} from "./mqtt/OwnBambuClient.js";
import {PausePrintCommand} from "./mqtt/PausePrintCommand.js";
import {ResumePrintCommand} from "./mqtt/ResumePrintCommand.js";
import {GetVersionCommand} from "bambu-node";
import {EventEmitter} from "events";
import PrinterPlugin from "../main.js";

export class MqttBambuConnection {

    client: OwnBambuClient;
    status: string = 'OFFLINE';
    printerId: number;

    printer: PrinterPlugin;

    constructor(ip: string, code: string, serial: string, printerId: number) {
        this.printerId = printerId;

        this.client = new OwnBambuClient({
            host: ip,
            accessToken: code,
            serialNumber: serial
        })

        PrinterPlugin.logger.info(`Connecting to printer with id: ${printerId} at ${ip} with serial: ${serial}`);

        this.client.on("printer:statusUpdate", (oldStatus, newStatus) => {
            PrinterPlugin.logger.info(`Printer with id: ${printerId} status changed from ${oldStatus} to ${newStatus}`);
            this.status = newStatus;
        })

        this.client.on("rawMessage", (topic, message) => {

            const data = JSON.parse(message.toString());

            const firstKey = Object.keys(data)[0];
            const topicName = `${firstKey}.${data[firstKey].command}`;

            // WebsocketsManager.getWebsocketsManager().sendBambuMessage(this.printerId, topicName, data);
        });
    }

    async connect() {
        await this.client.connect();
    }
}
