import {IPrinter, IUser} from "../../models";
import {UnauthorizedError} from "../../errors";


export interface PrinterActionResponse {
    user: IUser;
    printer: IPrinter;
    result: "requested" | "success" | "error" | "timeout";
}

export type PrinterActionError = {
    code: 500;
    message: "Error";
    error?: string;
} | UnauthorizedError;
