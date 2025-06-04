import {AbstractCommand, CommandResponse} from "bambu-node";

export class SetTemperatureCommand extends AbstractCommand {
    command: string = "gcode_line";
    category: "info" | "pushing" | "system" | "print" = "print";

    ownsResponse(command: CommandResponse): boolean {
        return command.command === "gcode_line" && (command.param.startsWith(`M140 S`) || command?.param.startsWith(`M104 S`));
    }

    private component: string;
    private temperature: number;

    constructor(component: string, temperature: number) {
        super();
        this.component = component;
        this.temperature = temperature;

        this.extra = this.toObject();
    }

    toObject(): Record<string, any> {
        let gcode = '';
        if (this.component === 'bed') {
            gcode = `M140 S${this.temperature}\n`;
        } else if (this.component.startsWith('hotend')) {
            const nozzleIndex = parseInt(this.component.replace('hotend', '')) - 1;
            if (nozzleIndex > 0) {
                gcode = `M104 T${nozzleIndex + 1} S${this.temperature}\n`;
            } else {
                gcode = `M104 S${this.temperature}\n`;
            }
        }

        return {
            "param": gcode,
        };
    }
}
