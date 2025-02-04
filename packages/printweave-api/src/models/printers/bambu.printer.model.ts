import { Table, Column, DataType } from 'sequelize-typescript';
import { BasePrinter } from './base.printer.js';
import { ConnectionManager, PrinterConnectionsBambu } from '../../connections/manager.connection.js';
import { GetVersionCommand, GetVersionResponse, PrintMessage, PrintMessageCommand } from 'bambu-node';
import { OwnPrintMessageCommand } from '../../connections/bambu/mqtt/OwnBambuClient.js';
import { PausePrintCommand } from '../../connections/bambu/mqtt/PausePrintCommand.js';
import { ResumePrintCommand } from '../../connections/bambu/mqtt/ResumePrintCommand.js';
import { StopPrintCommand } from '../../connections/bambu/mqtt/StopPrintCommand.js';

@Table({
    tableName: 'bambu_printers',
    timestamps: true
})
export class BambuPrinter extends BasePrinter {
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare type: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare ip: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare code: string;


    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare serial: string;

    // Implement abstract methods
    async getVersion(): Promise<string> {
        const connection = await this.getConnection();
        const response = await connection.mqtt.client.executeCommand(new GetVersionCommand);

        // TODO: Respond with the version
        throw new Error('Method not implemented.');

        return "";
    }

    async stopPrint(): Promise<string> {
        try {
            const connection = await this.getConnection();
            await connection.mqtt.client.executeCommand(new StopPrintCommand, false);
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            }
        }
    }

    async pausePrint(): Promise<string> {
        try {
            const connection = await this.getConnection();
            await connection.mqtt.client.executeCommand(new PausePrintCommand, false);
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            } else {
                throw error;
            }
        }
    }

    async resumePrint(): Promise<string> {
        try {
            const connection = await this.getConnection();
            await connection.mqtt.client.executeCommand(new ResumePrintCommand, false);
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            } else {
                throw error;
            }
        }
    }

    public async getConnection(): Promise<PrinterConnectionsBambu> {
        try {
            const connection = await ConnectionManager.getConnectionManager().getConnection(this.dataValues.printerId);
            if (!connection) {
                throw new Error('Printer connection not found');
            }
            return connection as PrinterConnectionsBambu;
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                throw new PrinterTimeOutError(error);
            } else {
                throw error;
            }
        }
    }
}

export class PrinterTimeOutError extends Error {
    constructor(error: Error) {
        super(error.message);
        this.name = 'PrinterTimeOutError';
    }
}

export default BambuPrinter;
