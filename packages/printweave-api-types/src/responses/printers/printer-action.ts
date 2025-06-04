import {IPrinter, IUser} from "../../models";
import {UnauthorizedError} from "../../errors";


export interface PrinterActionResponse {
    user: IUser;
    printer: IPrinter;
    result: "requested" | "success" | "error" | "timeout";
}

export type PrinterActionError =
    | {
        code: 500;
        message: "Error";
        error?: string;
      }
    | UnauthorizedError
    | {
        code: 400;
        message: string;
      }
    | {
        code: 408;
        message: "timeout";
      }
    | {
        code: 404;
        message: "Printer not found";
      }
    | {
        code: 422;
        message: string;
        details?: string;
      };

// Error type for invalid move axis parameters
export interface InvalidMoveAxisError {
    code: 400;
    message: string;
}

// Error type for invalid home axes parameters
export interface InvalidHomeAxesError {
    code: 400;
    message: string;
}

// Error type for invalid temperature parameters
export interface InvalidTemperatureError {
    code: 400;
    message: string;
}

// Error type for invalid fan speed parameters
export interface InvalidFanSpeedError {
    code: 400;
    message: string;
}
