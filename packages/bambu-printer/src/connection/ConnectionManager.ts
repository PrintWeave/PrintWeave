import {MqttBambuConnection} from "./mqtt.bambu.connection.js";
import {IPrinter} from "@printweave/api-types";
import {BambuPrinter} from "../bambu.printer.model.js";
import {FtpsBambuConnection} from "./ftps.connection.js";
import {Printer} from "@printweave/models";
import PrinterPlugin from "main.js";
import {BambuVideoProcessor} from "./video.bambu.js";

interface ConnectionsList {
    [printerId: number]: PrinterConnectionsBambu;
}

export interface PrinterConnectionsBambu {
    video: BambuVideoProcessor,
    mqtt: MqttBambuConnection,
    ftps: FtpsBambuConnection
}

export class ConnectionManager {

    connections: ConnectionsList = {};
    printerPlugin: PrinterPlugin;

    constructor(printerPlugin: PrinterPlugin) {
        this.printerPlugin = printerPlugin;
    }

    async generateConnectionsPrinter(printer: Printer) {
        if (printer.type === 'bambu') {
            const bambuPrinter = await BambuPrinter.findOne({where: {printerId: printer.id}});

            if (!bambuPrinter) {
                throw new Error('Bambu printer not found');
            }

            await this.generateConnectionsBambu(bambuPrinter, printer);
        } else {
            throw new Error('Invalid printer type');
        }
    }

    async generateConnectionsBambu(bambuPrinter: BambuPrinter, printer: Printer) {
        let mqttBambuConnection = new MqttBambuConnection(bambuPrinter.dataValues.ip, bambuPrinter.dataValues.code, bambuPrinter.dataValues.serial, printer.dataValues.id);

        await mqttBambuConnection.connect();

        this.connections[printer.id] = {
            mqtt: mqttBambuConnection,
            video: new BambuVideoProcessor(bambuPrinter.dataValues.ip, bambuPrinter.dataValues.code),
            ftps: new FtpsBambuConnection(bambuPrinter.dataValues.ip, bambuPrinter.dataValues.code)
        }
    }

    async getConnection(printerId: number) {
        let connection = this.connections[printerId];

        if (!connection) {
            const printer = await Printer.findByPk(printerId);

            if (!printer) {
                throw new Error('Printer not found');
            }

            await this.generateConnectionsPrinter(printer);
            connection = this.connections[printerId];
        }

        return connection;
    }

}
