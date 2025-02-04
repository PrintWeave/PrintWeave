import {UnauthorizedError} from "../../errors";
import {IPrinter, IUser} from "../../models";

export type BambuMQTTMessageError = UnauthorizedError | {
    code: 500;
    message: "Error";
    error: string;
} | {
    code: 404;
    message: "Printer not a Bambu printer";
}


export type BambuMQTTMessageResponse = {
    user: IUser;
    printer: IPrinter;
    result: "requested" | "timeout";
}
