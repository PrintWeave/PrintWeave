import {Column, DataType, ForeignKey, Model} from "sequelize-typescript";
import Printer from "../printer.model.js";
import {PrinterStatus, PrintFileReport} from "@printweave/api-types";

export abstract class BasePrinter extends Model {

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    @ForeignKey(() => Printer)
    declare printerId: number;


    abstract getVersion(): Promise<string>;

    abstract stopPrint(): Promise<string>;

    abstract pausePrint(): Promise<string>;

    abstract resumePrint(): Promise<string>;

    abstract getStatus(): Promise<PrinterStatus>;

    abstract uploadFile(file: Express.Multer.File, report: PrintFileReport): Promise<string>;
}
