import PrinterModel from "./printer.model.js";
import {BasePrinter} from "./base.printer.js";

export interface IPrintWeaveApp {
    getFullPrinter(printer: PrinterModel): Promise<BasePrinter>;
    getPrinter(printerId: number): Promise<PrinterModel>;
}
