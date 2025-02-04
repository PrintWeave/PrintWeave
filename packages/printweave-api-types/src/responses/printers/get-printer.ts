import {IPrinter, IUser} from "../../models";
import {UnauthorizedError} from "../../errors";

export interface GetPrinterResponse {
    user: IUser;
    printer?: IPrinter;
}

export type GetPrinterError = UnauthorizedError
