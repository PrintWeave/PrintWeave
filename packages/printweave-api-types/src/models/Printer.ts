import {IUserPrinter} from "./UserPrinter";
import {IModel} from "./Model";

export interface IPrinter extends IModel {
    name: string;
    type: 'bambu' | 'other';
    active: boolean;
    userPrinter?: IUserPrinter
}
