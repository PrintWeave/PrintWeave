import {AbstractCommand, PrintMessage} from "bambu-node";

export class CustomMessageCommand extends AbstractCommand {
    public category: "info" | "pushing" | "system" | "print";
    public command: string;

    constructor(data: any) {
        super();

        const allKeys = Object.keys(data);
        if (allKeys.length !== 1) {
            throw new Error('Invalid message');
        }

        const key = allKeys[0];
        const value = data[key];
        if (typeof value !== 'object') {
            throw new Error('Invalid message');
        }

        this.category = key as ("info" | "pushing" | "system" | "print");
        this.command = value.command;

        if (typeof this.command !== 'string') {
            throw new Error('Invalid message');
        }

        const keys = Object.keys(value);
        for (const key of keys) {
            if (key !== 'command') {
                this[key] = value[key];
            }
        }
    }

    ownsResponse = (data: any): data is CustomMessageCommand => {
        const keys = Object.keys(data);
        const firstKey = keys[0];

        if (firstKey !== this.category) {
            return false;
        }

        const value = data[firstKey];
        if (value.command !== this.command) {
            return false;
        }

        return true;
    }
}
