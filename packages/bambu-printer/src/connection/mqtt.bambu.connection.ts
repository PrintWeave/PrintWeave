import {StopPrintCommand} from "./mqtt/StopPrintCommand.js";
import {OwnBambuClient} from "./mqtt/OwnBambuClient.js";
import {PausePrintCommand} from "./mqtt/PausePrintCommand.js";
import {ResumePrintCommand} from "./mqtt/ResumePrintCommand.js";
import {GetVersionCommand} from "bambu-node";
import {EventEmitter} from "events";
import PrinterPlugin from "../main.js";
import {BambuWebsocketConnection} from "websockets.manager.js";

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
            PrinterPlugin.logger.info(`Printer with id: ${printerId} status changed from ${oldStatus} to ${newStatus}`);
            this.status = newStatus;
        })

        this.client.on("rawMessage", (topic, message) => {
            const data = JSON.parse(message.toString());

            PrinterPlugin.logger.info(`Printer with id: ${printerId} received raw message: ${topic} - ${message.toString()}`);

            const firstKey = Object.keys(data)[0];
            const topicName = `${firstKey}.${data[firstKey].command}`;

            PrinterPlugin.getInstance().getBambuWebsocketSubscriptionManager().sendMessageToAll(JSON.stringify({
                message: 'mqtt',
                printerId: this.printerId,
                mqtt: {
                    command: topicName,
                    data: data
                }
            }));

            PrinterPlugin.getInstance().getBambuWebsocketSubscriptionManager().sendMessageToFiltered(JSON.stringify({
                message: 'mqtt',
                printerId: this.printerId,
                mqtt: {
                    command: topicName,
                    data: data
                }
            }), (subscriber) => {
                return subscriber.printerId === this.printerId;
            })
        });
    }

    async connect() {
        await this.client.connect();
    }
}
