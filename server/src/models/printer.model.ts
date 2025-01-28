import {DataTypes, Model, Optional, Sequelize} from "sequelize";
import db from "../config/database.config.js";
import {User} from "./user.model.js";
import {UserPrinter} from "./userprinter.model.js";
import {BambuPrinter} from "./printers/bambu.printer.model.js";
import {BasePrinter} from "./printers/base.printer.model.js";

interface PrinterAttributes {
    id: number;
    name: string;
    type: string;
}

interface PrinterCreationAttributes extends Optional<PrinterAttributes, 'id'> {
}

export class Printer extends Model<PrinterAttributes, PrinterCreationAttributes> {
    declare id: number;
    name!: string;
    type!: string;
    declare printer: BasePrinter<any, any>;

    static async findById(id: string) {
        return Printer.findByPk(id);
    }

    async getPrinter(): Promise<BasePrinter<any, any>> {
        switch (this.type) {
            case 'bambu':
                return BambuPrinter.findOne({where: {printerId: this.id}});
            default:
                return null;
        }
    }
}

Printer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        unique: true
    },
    type: {
        type: DataTypes.STRING
    }
}, {
    sequelize: db,
    modelName: 'printers'
});

// Printer.belongsToMany(User, { through: UserPrinter, foreignKey: 'printerId' });
// User.belongsToMany(Printer, { through: UserPrinter });
