import {IPrinter, IUser} from "../../models";
import {UnauthorizedError} from "../../errors";

export interface GetPrintersResponse {
    user: IUser;
    printers: IPrinter[];
}

export type GetPrintersError = UnauthorizedError
