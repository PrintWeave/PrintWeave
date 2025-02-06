import mqtt from "mqtt";
import {Json} from "sequelize/lib/utils";

export class BambuWebsocketsConnection {
    printerId: number;
    connection: any;
    constructor(printerId: number, connection: any) {
        this.printerId = printerId;
        this.connection = connection;
    }

    async broadcastMQTTMessage(topic: string, message: any) {
        await this.connection.send(JSON.stringify({
            message: 'mqtt',
            printerId: this.printerId,
            mqtt: {
                command: topic,
                data: message
            }
        }));
    }
}
