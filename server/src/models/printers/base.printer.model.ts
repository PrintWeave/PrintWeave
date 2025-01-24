import {Model, Optional} from "sequelize";

export interface BasePrinterAttributes {
    printerId: number;
}


export class BasePrinter<T extends BasePrinterAttributes, C extends Optional<BasePrinterAttributes, 'printerId'>> extends Model<T, C> {
    declare printerId: number;
}
