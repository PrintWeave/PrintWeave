// packages/printweave-api/src/models/printers/bambu.printer.model.ts
import {Table, Column, DataType, ForeignKey} from 'sequelize-typescript';
import {
    AMS,
    AMSTray,
    GetVersionCommand,
    PushAllCommand,
    PushAllResponse
} from 'bambu-node';
import {PausePrintCommand} from './connection/mqtt/PausePrintCommand.js';
import {ResumePrintCommand} from './connection/mqtt/ResumePrintCommand.js';
import {StopPrintCommand} from './connection/mqtt/StopPrintCommand.js';
import {Light, PrinterStatus, Filament, MultiMaterial, PrintFileReport} from "@printweave/api-types";
import path from "path";
import {Readable} from "node:stream";
import {ConnectionManager, PrinterConnectionsBambu} from "./connection/ConnectionManager.js";
import {BasePrinter, PrinterTimeOutError, PrintWeaveFile} from "@printweave/models";
import PrinterPlugin from "./main.js";

@Table({
    tableName: 'bambu_printers',
    timestamps: true
})
export class BambuPrinter extends BasePrinter {
    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    type!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    ip!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    code!: string;


    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    serial!: string;

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
            const connection = await PrinterPlugin.getInstance().getConnectionManager().getConnection(this.dataValues.printerId);
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

    async getStatus(): Promise<PrinterStatus> {
        let status: PrinterStatus = {
            bedTargetTemp: 0,
            bedTemp: 0,
            fanSpeeds: [],
            gcode_file: "",
            nozzles: [],
            wifiSignal: '-0dBm',
            status: "IDLE",
            progress: {
                percentage: 0,
                timeLeft: 0,
                layer: 0,
                totalLayers: 0
            },
            lights: []
        }

        const connection = await this.getConnection();
        const response = await connection.mqtt.client.executeCommand(new PushAllCommand()) as PushAllResponse;

        status.bedTargetTemp = response.bed_target_temper;
        status.bedTemp = response.bed_temper;
        status.wifiSignal = response.wifi_signal;
        status.fanSpeeds = [
            {fan: 'chamber', speed: parseInt(response.big_fan2_speed)},
            {fan: 'part', speed: parseInt(response.cooling_fan_speed)},
            {fan: 'aux', speed: parseInt(response.big_fan1_speed)}
        ];

        status.status = response.gcode_state;
        status.gcode_file = response.gcode_file;

        status.progress = {
            percentage: response.mc_percent,
            timeLeft: response.mc_remaining_time,
            layer: response.layer_num,
            totalLayers: response.total_layer_num
        };

        status.lights = response.lights_report.map(
            light => ({
                name: light.node,
                status: light.mode === 'on' ? 'on' : 'off'
            } as Light)
        );

        const getFilamentType = (response: AMSTray): Filament => {
            if (!response.tray_type) {
                return null;
            }

            return {
                type: response.tray_type,
                color: response.tray_color,
                nozzleTemp: {
                    minTemp: parseInt(response.nozzle_temp_min),
                    maxTemp: parseInt(response.nozzle_temp_max)
                },
                bedTemp: {
                    minTemp: parseInt(response.bed_temp),
                    maxTemp: parseInt(response.bed_temp)
                },
                dryTemp: parseInt(response.drying_temp),
                dryTime: parseInt(response.drying_time),
                weight: parseFloat(response.tray_weight),
                diameter: response.tray_diameter
            } as Filament;
        };

        let currentFilament: Filament | null = null;
        const trayTar = parseInt(response.ams.tray_tar);

        if (trayTar === 254) {
            currentFilament = getFilamentType(response.vt_tray);
        } else if (trayTar === 255) {
            currentFilament = null;
        } else {
            const amsIndex = Math.floor(trayTar / 4);
            const trayIndex = trayTar % 4;
            let am = response.ams.ams[amsIndex];
            currentFilament = getFilamentType(am.tray[trayIndex]);
        }

        status.nozzles = [
            {
                id: 0,
                nozzleTemp: response.nozzle_temper,
                nozzleTargetTemp: response.nozzle_target_temper,
                multiMaterials: [
                    {
                        id: 0,
                        type: 'single',
                        trays: [{
                            id: 0,
                            material: getFilamentType(response.vt_tray)
                        }]
                    },
                    ...response.ams.ams.map((am: AMS, index: number) => ({
                        id: index + 1,
                        type: 'multi',
                        humidity: parseInt(am.humidity),
                        trays: am.tray.map((tray, trayIndex) => ({
                            id: trayIndex,
                            material: getFilamentType(tray)
                        }))
                    } as MultiMaterial))
                ],
                currentFilament,
                diameter: 0,
                type: 'Brass'
            }
        ];

        return status;
    }

    override async uploadFile(file: PrintWeaveFile, report: PrintFileReport): Promise<PrintFileReport> {
        const connection = await this.getConnection();
        const response = await connection.ftps.connect();

        await response.uploadFile(file.path, path.join('/printweave', 'gcode', file.originalname));

        for (const plate of report.plates) {
            if (plate.thumbnailRaw) {
                const thumbnailName = file.originalname.split('.').slice(0, -1).join('.') + '.plate_' + plate.id + '.png';
                const readStream = await this.convertToReadable(plate.thumbnailRaw.stream());
                await response.uploadFileFromReadable(readStream, path.join('/printweave', 'thumbnails', thumbnailName));
                plate.thumbnail = thumbnailName;
            }
        }

        const reportJson = JSON.stringify(report);
        const reportName = file.originalname.split('.').slice(0, -1).join('.') + '.json';
        await response.uploadFileFromReadable(Readable.from(reportJson), path.join('/printweave', 'reports', reportName));

        response.disconnect();

        return report;
    }

    async convertToReadable(webStream: ReadableStream<Uint8Array>): Promise<Readable> {
        const reader = webStream.getReader();

        return new Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(Buffer.from(value));
                    }
                } catch (error) {
                    this.destroy(error);
                }
            }
        });
    }
}
