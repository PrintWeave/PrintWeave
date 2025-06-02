import {UnauthorizedError} from "../../errors";
import {IPrinter, PrinterStatus, StatusType} from "../../models";

export interface PrinterStatusData {
    printerId: number;
    statusType: StatusType
    status: PrinterStatus;
    printer: IPrinter
}

export interface GetPrinterStatusesResponse {
    message: string;
    printerStatuses: PrinterStatusData[];
}

export type GetPrinterStatusesError = UnauthorizedError;
