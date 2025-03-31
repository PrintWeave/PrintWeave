import {BasicWebsocketSubscriptionManager, User, UserPrinter, WebSocket, WebsocketConnection} from "@printweave/models";
import PrinterPlugin from "./main.js";


export class BambuWebsocketSubscriptionManager extends BasicWebsocketSubscriptionManager<BambuWebsocketConnection> {

    id: string = "BambuWebsocketSubscriptionManager";
    type: string = "bambu";

    async checkAllowSubscription(user: User, data: any): Promise<boolean> {
        const printerId = data.printerId;

        if (!printerId) {
            return false
        }

        // Check if the user has permission to access the printer
        const userPrinter = await UserPrinter.findAll({
            where: {
                userId: user.id,
                printerId: printerId,
                permission: ['view', 'operate', 'admin']
            }
        })

        return userPrinter.length > 0;
    }

    async onSubscribe(ws: WebSocket, data: any, user: User): Promise<void> {
        await super.onSubscribe(ws, data, user);

        await PrinterPlugin.getInstance().getConnectionManager().getConnection(data.printerId);

        this.sendMessageToAll(JSON.stringify({
            message: 'Subscribed to Bambu printer',
            printerId: data.printerId
        }));
    }

    async handleMessage(subscriber: BambuWebsocketConnection, data: any): Promise<void> {
        PrinterPlugin.logger.info(`BambuWebsocketSubscription: ${subscriber.user.username} sent message: ${JSON.stringify(data)}`);
    }
}

export class BambuWebsocketConnection extends WebsocketConnection {
    printerId: number;

    constructor(ws: WebSocket, data: any, user: User) {
        super(ws, data, user);
        this.printerId = data.printerId;
    }
}
