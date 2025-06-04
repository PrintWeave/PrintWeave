import {AbstractCommand, CommandResponse, GCodeCommand} from "bambu-node";

export class MoveAxisCommand extends AbstractCommand {
    category: "print" | "info" | "pushing" | "system" = "print";
    command: string;
    ownsResponse(command: CommandResponse): boolean {
        return command.command === "gcode_line" && command.param.startsWith(`G1 ${this.axis}${this.distance}`);
    }

    private axis: string;
    private distance: number;

    constructor(axis: string, distance: number) {
        super({
            command: "gcode_line",
            param: `M211 S \nM211 X1 Y1 Z1\nM1002 push_ref_mode\nG91 \nG1 ${axis.toUpperCase()}${distance * 10 / 10} F3000\nM1002 pop_ref_mode\nM211 R\n`,
            sequence_id: Math.floor(Math.random() * 10000).toString()
        });
        this.axis = axis.toUpperCase();
        this.distance = distance;
    }
}
