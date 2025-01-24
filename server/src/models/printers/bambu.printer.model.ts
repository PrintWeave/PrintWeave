import {DataTypes, Model, Optional, Sequelize} from "sequelize";
import db from "../../config/database.config";
import {Printer} from "../printer.model";
import {BasePrinter, BasePrinterAttributes} from "./base.printer.model";

interface BambuPrinterAttributes extends BasePrinterAttributes {
    id: number;
    printerId: number;
    type: string;
    ip: string;
    code: string;
    amsVersion: string;
    serial: string;
}

interface BambuPrinterCreationAttributes extends Optional<BambuPrinterAttributes, 'id' | 'serial'> {}

export class BambuPrinter extends BasePrinter<BambuPrinterAttributes, BambuPrinterCreationAttributes> {
    declare id: number;
    type!: string;
    ip!: string;
    code!: string;
    amsVersion!: string;
    declare serial: string;

    static async findById(id: string) {
        return BambuPrinter.findByPk(id);
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
