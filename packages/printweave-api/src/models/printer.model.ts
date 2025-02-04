import {Table, Column, Model, DataType, HasOne, ForeignKey} from 'sequelize-typescript';
import {BasePrinter} from './printers/base.printer.js';
import BambuPrinter from './printers/bambu.printer.model.js';
import {IPrinter} from "@printweave/api-types";
import UserPrinter from "./userprinter.model.js";
import {NonAttribute} from "sequelize";

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
        type: DataType.ENUM('bambu', 'other'),
        allowNull: false
    })
    declare type: 'bambu' | 'other';

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    declare active: boolean;

    async getPrinter(): Promise<BasePrinter> {
        switch (this.type) {
            case 'bambu':
                return BambuPrinter.findOne({where: {printerId: this.id}});
            default:
                return null;
        }
    }
}

export default Printer;
