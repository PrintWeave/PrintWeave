import {BambuWebsocketsConnection} from "./connections/bambu.connection.websockets.js";
import {WebSocketServer, RawData, WebSocket} from "ws";
import {ConnectionManager} from "../connections/manager.connection.js";
import {authMiddleware} from "../routes/auth.route.js";
import User from "../models/user.model.js";
import UserPrinter from "../models/userprinter.model.js";

const snakeToCamel = (str: string) => str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

function toCamalCase(obj: any) {
    const keys = Object.keys(obj);
    keys.forEach(key => {
        if (typeof obj[key] === 'object')
            toCamalCase(obj[key]);

        const converted = snakeToCamel(key);
        if (key !== converted) {
            obj[converted] = obj[key];
            delete obj[key];
        }
    });

    return obj;
}

export class WebsocketsManager {
    private static instance: WebsocketsManager;

    static getWebsocketsManager() {
        if (!WebsocketsManager.instance) {
            WebsocketsManager.instance = new WebsocketsManager();
        }
        return WebsocketsManager.instance;
    }

    private bambuConnections: any = {};

    async handleMessage(ws: WebSocket, rawMessage: RawData, user: User) {
        let data: any;
        try {
            data = JSON.parse(rawMessage.toString());
        } catch (e) {
            console.error('Invalid JSON message:', rawMessage.toString());
            return;
        }

        data = toCamalCase(data);

        const {message} = data;

        if (!message) {
            ws.send(JSON.stringify({message: 'Invalid message'}));
            return;
        }


        if (message === 'subscribe') {
            const userPrinters = await UserPrinter.findAll({where: {userId: user.id, permission: ['view', 'operate', 'admin']}});
            const printerIds = userPrinters.map((userPrinter: any) => userPrinter.printerId);

            const {printerId, subscriptionType} = data;

            if (!printerId || !subscriptionType) {
                ws.send(JSON.stringify({message: 'Invalid subscription'}));
                return;
            }

            if (!printerIds.includes(printerId)) {
                ws.send(JSON.stringify({message: 'Printer not found'}));
                return;
            }

            if (subscriptionType === 'bambu') {
                this.addBambuConnection(new BambuWebsocketsConnection(printerId, ws));

                const connectionManager = ConnectionManager.getConnectionManager();
                connectionManager.getConnection(printerId).then((bambuPrinterConnection) => {
                    console.log(bambuPrinterConnection.mqtt.status);
                });

                ws.send(JSON.stringify({message: 'subscribed', printerId, subscriptionType}));
            } else {
                ws.send(JSON.stringify({message: 'Invalid subscription type'}));
                return;
            }
        } else {
            ws.send(JSON.stringify({message: 'Invalid message'}));
            return;
        }
    }

    addBambuConnection(connection: BambuWebsocketsConnection) {
        if (!this.bambuConnections[connection.printerId]) {
            this.bambuConnections[connection.printerId] = [];
        }
        this.bambuConnections[connection.printerId].push(connection);
    }

    sendBambuMessage(printerId: number, topic: string, message: any) {
        if (!this.bambuConnections[printerId]) {
            return;
        }

        this.bambuConnections[printerId].forEach((connection: BambuWebsocketsConnection) => {
            connection.broadcastMQTTMessage(topic, message).catch((e: any) => {
                console.error('Error sending message:', e);
            });
        });
    }
}

export class BambuWebsocketsConnectionList {
    [key: number]: BambuWebsocketsConnection[]
}
