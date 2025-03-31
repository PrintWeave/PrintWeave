import {User} from "./user.model.js";
import {RawData, WebSocket} from "ws";

export {WebSocket, RawData} from "ws";

/**
 * @see BasicWebsocketSubscription for the implementation of the WebSocket connection
 * Note: messages are not automatically parsed, you need to parse them yourself, check {@link BasicWebsocketSubscriptionManager} for an already implemented example
 */
export abstract class BaseWebsocketManager {
    abstract id: string;

    abstract onMessage(ws: WebSocket, data: any, user: User): Promise<void>;
}

export abstract class BasicWebsocketSubscriptionManager<T extends WebsocketConnection> extends BaseWebsocketManager {
    abstract id: string;
    abstract type: string;

    protected connections: T[] = [];

    async onMessage(ws: WebSocket, data: any, user: User) {
        if (data.message === 'subscribe') {
            if (data['subscriptionType'] !== this.type) {
                return;
            }

            await this.onSubscribe(ws, data, user);
        }
    }

    async onSubscribe(ws: WebSocket, data: any, user: User): Promise<void> {
        const isAllowed = await this.checkAllowSubscription(user, data);
        if (!isAllowed) {
            ws.send(JSON.stringify({message: 'Not allowed to subscribe'}));
            return;
        }

        // Create a proper instance instead of using type assertion
        let subscriber = this.createConnection(ws, data, user);
        this.connections.push(subscriber);

        ws.on('message', async (rawMessage: RawData) => {
            let data: any;
            try {
                data = JSON.parse(rawMessage.toString());
            } catch (e) {
                return;
            }

            data = toCamalCase(data);

            await this.handleMessage(subscriber, data);
        });

        ws.send(JSON.stringify({message: 'Subscribed to ' + this.type}));
    }

    // Add a factory method to create proper instances
    protected createConnection(ws: WebSocket, data: any, user: User): T {
        return new WebsocketConnection(ws, data, user) as T;
    }

    async onUnsubscribe(subscriber: T, data: any): Promise<void> {
        const index = this.connections.indexOf(subscriber);
        if (index !== -1) {
            this.connections.splice(index, 1);
        }

        subscriber.ws.close();
    }

    abstract checkAllowSubscription(user: User, data: any): Promise<boolean>;

    abstract handleMessage(subscriber: T, data: any): Promise<void>;

    sendMessageToAll(message: any) {
        const messageString = JSON.stringify(message);
        let invalidConnections: T[] = [];

        for (const connection of this.connections) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.send(messageString);
            } else {
                invalidConnections.push(connection);
            }
        }

        this.connections = this.connections.filter(connection => !invalidConnections.includes(connection));
    }

    sendMessageToUser(userId: string, message: any) {
        const messageString = JSON.stringify(message);
        let invalidConnections: T[] = [];

        for (const connection of this.connections) {
            if (connection.user.id === userId) {
                if (connection.ws.readyState === WebSocket.OPEN) {
                    connection.send(messageString);
                } else {
                    invalidConnections.push(connection);
                }
            }
        }

        this.connections = this.connections.filter(connection => !invalidConnections.includes(connection));
    }

    sendMessageToFiltered(message: any, filter: (connection: T) => boolean) {
        const messageString = JSON.stringify(message);
        let invalidConnections: T[] = [];

        for (const connection of this.connections) {
            if (filter(connection)) {
                if (connection.ws.readyState === WebSocket.OPEN) {
                    connection.send(messageString);
                } else {
                    invalidConnections.push(connection);
                }
            }
        }

        this.connections = this.connections.filter(connection => !invalidConnections.includes(connection));
    }
}


export class WebsocketConnection {
    ws: WebSocket;
    data: any;
    user: User;

    constructor(ws: WebSocket, data: any, user: User) {
        this.ws = ws;
        this.data = data;
        this.user = user;
    }

    send(message: string) {
        this.ws.send(message);
    }
}

const snakeToCamel = (str: string) => str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

export function toCamalCase(obj: any) {
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

