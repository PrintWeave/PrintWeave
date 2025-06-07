import {AbstractCommand, CommandResponse, GCodeCommand, GCodeCommandParam} from "bambu-node";

export class HomeAxesCommand extends AbstractCommand {
    category: "print" | "info" | "pushing" | "system" = "print";
    command: GCodeCommandParam;

    ownsResponse(command: CommandResponse): boolean {
        return command.command === "gcode_line" && command.param.startsWith("G28");
    }

    constructor(axes: string[]) {
        super({
            command: "gcode_line",
            param: `G28 ${axes.join(' ')}\n`,
            sequence_id: Math.floor(Math.random() * 10000).toString()
        });
    }
}
