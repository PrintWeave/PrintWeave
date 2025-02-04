import { IPrinter, IUser, PrinterStatus } from "../../models";
import { UnauthorizedError } from "../../errors";
export interface PrinterStatusResponse {
    user: IUser;
    printer: IPrinter;
    status: PrinterStatus;
}
export type PrinterStatusError = {
    code: 408;
    message: "timeout";
} | {
    code: 500;
    message: "Error";
    error: string;
} | UnauthorizedError;
