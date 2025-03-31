import {WebSocketServer, RawData, WebSocket} from "ws";
import {User, UserPrinter, toCamalCase} from "@printweave/models";
import {PluginManager} from "../plugins/plugin.manager.js";
import {logger} from "../main.js";

export class WebsocketsManager {
    private pluginManager: PluginManager;

    constructor(pluginManager: PluginManager) {
        this.pluginManager = pluginManager;
    }

    async handleMessage(ws: WebSocket, rawMessage: RawData, user: User) {
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
}
