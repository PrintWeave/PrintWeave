import {AbstractCommand, CommandResponse, PrintMessage} from "bambu-node";


export class ResumePrintCommand extends AbstractCommand {
    public category: "info" | "pushing" | "system" | "print" = "print";
    public command: string = "resume";

    constructor() {
        super();
    }

    ownsResponse = (data: any): data is PrintMessage => {
        return data.command === this.command;
    }
}
