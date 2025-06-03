import {WebSocketServer, RawData, WebSocket} from "ws";
import {User, UserPrinter, toCamalCase} from "@printweave/models";
import {PluginManager} from "../plugins/plugin.manager.js";
import {logger} from "../main.js";
import {PrinterStatus, PrinterStatusData} from "@printweave/api-types";

export class WebsocketsManager {
    private pluginManager: PluginManager;
    private userWebsockets: { [userId: string]: WebSocket[] } = {};

    constructor(pluginManager: PluginManager) {
        this.pluginManager = pluginManager;
    }

    public async handleMessage(ws: WebSocket, rawMessage: RawData, user: User) {
        let data: any;
        try {
            data = JSON.parse(rawMessage.toString());
        } catch (e) {
            logger.error('Invalid JSON message:', rawMessage.toString());
            return;
        }

        data = toCamalCase(data);

        const allWebsocketManagers = this.pluginManager.getPlugins().map(plugin => {
            return plugin.websocketManagers;
        }).flat();

        for (const manager of allWebsocketManagers) {
            await manager.onMessage(ws, data, user);
        }
    }

    public sendMessage(userId: number, type: string, data: any) {
        if (!this.userWebsockets[userId]) {
            logger.info(`No WebSocket connections for user ${userId}, skipping send.`);
            return;
        }

        const message = JSON.stringify({
            type: type,
            data: data
        });

        this.userWebsockets[userId].forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            } else {
                logger.warn(`WebSocket for user ${userId} is not open, skipping send.`);
            }
        });
    }

    public addConnection(ws: WebSocket, user: User) {
        if (!this.userWebsockets[user.id]) {
            this.userWebsockets[user.id] = [];
        }
        this.userWebsockets[user.id].push(ws);

        logger.info(`WebSocket connection added for user ${user.id}. Total connections: ${this.userWebsockets[user.id].length}`);

        ws.on('message', (rawMessage: RawData) => {
            this.handleMessage(ws, rawMessage, user).catch(err => {
                logger.error('Error handling message:', err);
            });
        });

        ws.on('close', () => {
            logger.info(`WebSocket connection closed for user ${user.id}.`);
            this.removeConnection(ws, user);
        });
    }

    private removeConnection(ws: WebSocket, user: User) {
        if (!this.userWebsockets[user.id]) {
            return;
        }

        this.userWebsockets[user.id] = this.userWebsockets[user.id].filter(connection => connection !== ws);

        if (this.userWebsockets[user.id].length === 0) {
            delete this.userWebsockets[user.id];
        }
    }

    async sendMessagePrinter(printerId: number, type: string, data: any) {
        const userPrinters = await UserPrinter.findAll({
            where: {
                printerId: printerId
            },
        });


        logger.info(`Sending message to printer ${printerId} users: ${userPrinters.length} users`);
        userPrinters.forEach(userPrinter => {
            if (userPrinter.userId) {
                this.sendMessage(userPrinter.userId, type, data);
            }
        });
    }
}
