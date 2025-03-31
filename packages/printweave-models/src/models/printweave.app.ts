import PrinterModel from "./printer.model.js";
import {BasePrinter} from "./base.printer.js";

export interface IPrintWeaveApp {
    getPrinter(printer: PrinterModel): Promise<BasePrinter>;
}
