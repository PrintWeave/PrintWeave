import {DataTypes, Model, Optional} from "sequelize";
import db from "../config/database.config";
import {User} from "./user.model";
import {Printer} from "./printer.model";

interface UserPrinterAttributes {
    id: number;
    userId: number;
    printerId: number;
    permission: 'view' | 'operate' | 'admin';
}

interface UserPrinterCreationAttributes extends Optional<UserPrinterAttributes, 'id'> {}

export class UserPrinter extends Model<UserPrinterAttributes, UserPrinterCreationAttributes> {
    declare id: number;
    userId!: number;
    printerId!: number;
    permission!: 'view' | 'operate' | 'admin';
}

UserPrinter.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER
    },
    printerId: {
        type: DataTypes.INTEGER
    },
    permission: {
        type: DataTypes.ENUM('view', 'operate', 'admin'),
        defaultValue: 'view'
    }
}, {
    sequelize: db,
    modelName: 'user_printers'
});
