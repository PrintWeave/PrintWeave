import {IPrinter} from "./Printer";
import {IModel} from "./Model";

export interface IUser extends IModel {
    username: string;
    password: string;
    email: string;
    role: 'user' | 'admin';
    active: boolean;
    printers: IPrinter[];
}
