import {DataTypes, Model, Optional, Sequelize} from "sequelize";
import db from "../config/database.config";
import {User} from "./user.model";
import {UserPrinter} from "./userprinter.model";

interface PrinterAttributes {
    id: number;
    name: string;
    type: string;
}

interface PrinterCreationAttributes extends Optional<PrinterAttributes, 'id'> {}

export class Printer extends Model<PrinterAttributes, PrinterCreationAttributes> {
    declare id: number;
    name!: string;
    type!: string;

    static async findById(id: string) {
        return Printer.findByPk(id);
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

Printer.belongsToMany(User, { through: UserPrinter, foreignKey: 'printerId' });
User.belongsToMany(Printer, { through: UserPrinter });
