import { Table, Column, DataType } from 'sequelize-typescript';
import { BasePrinter } from './base.printer.model.js';
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
    type: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    ip: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    code: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    amsVersion: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    serial: string;

    // Implement abstract methods
    async getVersion(): Promise<string> {
        const connection = await this.getConnection();
        const response = await connection.mqtt.client.executeCommand(new GetVersionCommand);
        return "";
    }

    async stopPrint(): Promise<string> {
        const connection = await this.getConnection();
        await connection.mqtt.client.executeCommand(new StopPrintCommand, false);
        return 'unknown';
    }

    async pausePrint(): Promise<string> {
        const connection = await this.getConnection();
        await connection.mqtt.client.executeCommand(new PausePrintCommand, false);
        return 'unknown';
    }

    async resumePrint(): Promise<string> {
        const connection = await this.getConnection();
        await connection.mqtt.client.executeCommand(new ResumePrintCommand, false);
        return 'unknown';
    }

    private async getConnection(): Promise<PrinterConnectionsBambu> {
        const connection = await ConnectionManager.getConnectionManager().getConnection(this.printerId);
        if (!connection) {
            throw new Error('Printer connection not found');
        }
        return connection as PrinterConnectionsBambu;
    }
}

export default BambuPrinter;