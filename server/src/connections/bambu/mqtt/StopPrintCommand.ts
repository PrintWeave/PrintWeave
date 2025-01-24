import {AbstractCommand, CommandResponse, PrintMessage} from "bambu-node";


export class StopPrintCommand extends AbstractCommand {
    public category: "info" | "pushing" | "system" | "print" = "print";
    public command: string = "stop";

    constructor() {
        super();
    }

    ownsResponse = (data: any): data is PrintMessage => {
        return data.command === 'stop';
    }
}
