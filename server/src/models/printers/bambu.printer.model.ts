import {DataTypes, Model, Optional, Sequelize} from "sequelize";
import db from "../../config/database.config";
import {Printer} from "../printer.model";
import {BasePrinter, BasePrinterAttributes} from "./base.printer.model";
import {ConnectionManager, PrinterConnectionsBambu} from "../../connections/manager.connection";
import {GetVersionResponse, PrintMessage, PrintMessageCommand} from "bambu-node";
import {OwnPrintMessageCommand} from "../../connections/bambu/mqtt/OwnBambuClient";

interface BambuPrinterAttributes extends BasePrinterAttributes {
    id: number;
    printerId: number;
    type: string;
    ip: string;
    code: string;
    amsVersion: string;
    serial: string;
}

interface BambuPrinterCreationAttributes extends Optional<BambuPrinterAttributes, 'id'> {}

export class BambuPrinter extends BasePrinter<BambuPrinterAttributes, BambuPrinterCreationAttributes> {
    declare id: number;
    type!: string;
    ip!: string;
    code!: string;
    amsVersion!: string;
    serial!: string;

    static async findById(id: string) {
        return BambuPrinter.findByPk(id);
    }

    async getVersion(): Promise<string> {
        const mqttBambulab = (await ConnectionManager.getConnectionManager().getConnection(this.printerId) as PrinterConnectionsBambu).mqtt;

        console.log();

        return (await mqttBambulab.getVersion() as GetVersionResponse).module.filter((module) => module.name === 'ota')[0].sw_ver;
    }

    async stopPrint(): Promise<string> {
        const mqttBambulab = (await ConnectionManager.getConnectionManager().getConnection(this.printerId) as PrinterConnectionsBambu).mqtt;


        return (await mqttBambulab.stopPrint()as OwnPrintMessageCommand).result
    }

    async pausePrint(): Promise<string> {
        const mqttBambulab = (await ConnectionManager.getConnectionManager().getConnection(this.printerId) as PrinterConnectionsBambu).mqtt;

        return (await mqttBambulab.pausePrint()as OwnPrintMessageCommand).result
    }

    async resumePrint(): Promise<string> {
        const mqttBambulab = (await ConnectionManager.getConnectionManager().getConnection(this.printerId) as PrinterConnectionsBambu).mqtt;

        return (await mqttBambulab.resumePrint()as OwnPrintMessageCommand).result
    }
}

BambuPrinter.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    printerId: {
        type: DataTypes.INTEGER
    },
    type: {
        type: DataTypes.STRING
    },
    ip: {
        type: DataTypes.STRING
    },
    code: {
        type: DataTypes.STRING
    },
    amsVersion: {
        type: DataTypes.STRING
    },
    serial: {
        type: DataTypes.STRING
    }
}, {
    sequelize: db,
    modelName: 'printers_bambu'
});

// BambuPrinter.belongsTo(Printer, { foreignKey: 'printerId' });
