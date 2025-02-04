import {UnauthorizedError} from "../../errors";
import {IPrinter} from "../../models";

export interface RemovePrinterResponse {
    message: "Printer removed";
    printer: IPrinter;
}

export type RemovePrinterError = UnauthorizedError | {
    code: 404;
    message: "Printer not found" | "Invalid printer ID";
}
