import {Model, Optional} from "sequelize";

export interface BasePrinterAttributes {
    printerId: number;
}


export abstract class BasePrinter<T extends BasePrinterAttributes, C extends Optional<BasePrinterAttributes, 'printerId'>> extends Model<T, C> {
    declare printerId: number;

    abstract getVersion(): Promise<string>;

    abstract stopPrint(): Promise<string>;
    abstract pausePrint(): Promise<string>;
    abstract resumePrint(): Promise<string>;
}
