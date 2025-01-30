import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import Printer from "../printer.model.js";

export abstract class BasePrinter extends Model {

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    @ForeignKey(() => Printer)
    printerId: number;


    abstract getVersion(): Promise<string>;

    abstract stopPrint(): Promise<string>;
    abstract pausePrint(): Promise<string>;
    abstract resumePrint(): Promise<string>;
}
