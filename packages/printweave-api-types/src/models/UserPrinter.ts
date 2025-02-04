import {IPrinter} from "./Printer";
import {IUser} from "./User";
import {IModel} from "./Model";

export interface IUserPrinter extends IModel{
    userId: number;
    printerId: number;
    permission: 'view' | 'operate' | 'admin';
    user?: IUser
    printer?: IPrinter
}
