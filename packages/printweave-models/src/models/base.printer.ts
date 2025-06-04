import {Column, DataType, ForeignKey, Model} from "sequelize-typescript";
import {PrinterStatus, PrintFileReport, StatusType} from "@printweave/api-types";
import Printer from "./printer.model.js";
import {Multer} from "multer";
import {VideoProcessor, VideoStream} from "./video.model.js";

export abstract class BasePrinter extends Model {
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    @ForeignKey(() => Printer)
    declare printerId: number;

    abstract getVersion(): Promise<string>;

    abstract stopPrint(): Promise<string>;

    abstract pausePrint(): Promise<string>;

    abstract resumePrint(): Promise<string>;

    abstract getStatus(): Promise<PrinterStatus>;

    abstract uploadFile(file: PrintWeaveFile, report: PrintFileReport): Promise<PrintFileReport>;

    abstract getVideoProcessor(): Promise<VideoProcessor | null>;

    abstract moveAxis(axis: string, distance: number): Promise<string>;

    abstract homeAxes(axes: string[]): Promise<string>;

    abstract setTemperature(component: string, temperature: number): Promise<string>;

    abstract setFanSpeed(fan: string, speed: number): Promise<string>;

    getCacheTime(): number {
        return 300000; // Default cache time of 5 minutes
    }

    statusType: StatusType = StatusType.OFFLINE
}

export class PrinterTimeOutError extends Error {
    constructor(error: Error) {
        super(error.message);
        this.name = 'PrinterTimeOutError';
    }
}

export class PrinterUnAuthorizedError extends Error {
    constructor(error: Error) {
        super(error.message);
        this.name = 'PrinterUnauthorizedError';
    }
}

export type PrintWeaveFile = Express.Multer.File;
