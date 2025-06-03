import PrinterModel, {Printer} from "./printer.model.js";
import {BasePrinter} from "./base.printer.js";
import {PrinterStatus, StatusType} from "@printweave/api-types";

export interface IPrintWeaveApp {
    getFullPrinter(printer: PrinterModel): Promise<BasePrinter>;
    getPrinter(printerId: number): Promise<PrinterModel>;
    getPrinterStatusCached(printerId: number): Promise<{status: PrinterStatus | null, statusType: StatusType | null} | null>;
    getPrinterStatusFromCache(printerId: number): Promise<PrinterStatus | null>;
    getPrinterStatus(printerId: number): Promise<PrinterStatus | null>;
    setPrinterStatusCache(printer: Printer, status: {
        status: PrinterStatus;
        statusType: StatusType
    }, printerCacheTime?: number) : void;
}
