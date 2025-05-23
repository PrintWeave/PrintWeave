import {Table, Column, Model, DataType, HasOne, ForeignKey} from 'sequelize-typescript';
import {IPrinter} from "@printweave/api-types";
import {BasePrinter} from "./base.printer.js";

@Table({
    tableName: 'printers',
    timestamps: true
})
export class Printer extends Model implements IPrinter {
    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false
    })
    declare name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare type: string;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    declare active: boolean;
}

export default Printer;
