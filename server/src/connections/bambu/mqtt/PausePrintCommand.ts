import {AbstractCommand, CommandResponse, PrintMessage} from "bambu-node";


export class PausePrintCommand extends AbstractCommand {
    public category: "info" | "pushing" | "system" | "print" = "print";
    public command: string = "pause";

    constructor() {
        super();
    }

    ownsResponse = (data: any): data is PrintMessage => {
        return data.command === this.command;
    }
}
