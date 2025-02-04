import {IPrinter} from "../../models";
import {UnauthorizedError} from "../../errors";

export interface CreatePrinterResponse {
    message: "Printer created";
    printer?: IPrinter;
}

export type CreatePrinterError = UnauthorizedError | CreateBambuPrinterError | {
    code: 400;
    message: "Printer type not supported" | "Name and type are required" | "Name must be unique" | "Invalid printer type";
}

export interface CreateBambuPrinterError {
    code: 400;
    message: "IP, code, serial are required";
}
