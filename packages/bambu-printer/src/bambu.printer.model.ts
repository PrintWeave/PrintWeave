// packages/printweave-api/src/models/printers/bambu.printer.model.ts
import {Column, DataType, Table} from 'sequelize-typescript';
import {
    AMS,
    AMSTray,
    Fan,
    GCodeLineCommand,
    GetVersionCommand,
    NumberRange,
    PushAllCommand,
    PushAllResponse,
    UpdateFanCommand
} from 'bambu-node';
import {PausePrintCommand} from './connection/mqtt/PausePrintCommand.js';
import {ResumePrintCommand} from './connection/mqtt/ResumePrintCommand.js';
import {StopPrintCommand} from './connection/mqtt/StopPrintCommand.js';
import {HomeAxesCommand} from './connection/mqtt/HomeAxesCommand.js';
import {MoveAxisCommand} from './connection/mqtt/MoveAxisCommand.js';
import {SetTemperatureCommand} from './connection/mqtt/SetTemperatureCommand.js';
import {Filament, Light, MultiMaterial, PrinterStatus, PrintFileReport, StatusType} from "@printweave/api-types";
import path from "path";
import {Readable} from "node:stream";
import {PrinterConnectionsBambu} from "./connection/ConnectionManager.js";
import {BasePrinter, PrinterTimeOutError, PrinterUnAuthorizedError, PrintWeaveFile,} from "@printweave/models";
import PrinterPlugin from "./main.js";
import {VideoProcessor} from "@printweave/models/dist/models/video.model.js";

export enum BambuPrinterModels {
    X1 = 'X1',
    X1C = 'X1 Carbon',
    X1E = 'X1 Enterprise',
    H2D = 'H2D',
    P1S = 'P1S',
    P1P = 'P1P',
    A1 = 'A1',
    A1M = 'A1 Mini'
}

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

    async getPrinterModel(): Promise<BambuPrinterModels> {
        const modelCode = this.dataValues.serial.substring(0, 3).toUpperCase();
        switch (modelCode) {
            case '00W':
                return BambuPrinterModels.X1;
            case '00M':
                return BambuPrinterModels.X1C;
            case '03W':
                return BambuPrinterModels.X1E;
            case '094':
                return BambuPrinterModels.H2D;
            case '01P':
                return BambuPrinterModels.P1S;
            case '01S':
                return BambuPrinterModels.P1P;
            case '039':
                return BambuPrinterModels.A1;
            case '030':
                return BambuPrinterModels.A1M;
            default:
                throw new Error(`Unknown printer model: ${this.type}`);
        }
    }

    async positiveZAxis(): Promise<boolean> {
        let bambuPrinterModels = await this.getPrinterModel();
        if (bambuPrinterModels === BambuPrinterModels.A1 || bambuPrinterModels === BambuPrinterModels.A1M) {
            // A1 and A1M have a positive Z axis
            return true;
        }

        // All other models have a negative Z axis
        return false;
    }

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

            if (this.statusType === StatusType.OFFLINE || this.statusType === StatusType.UNAUTHORIZED) {
                this.statusType = StatusType.ONLINE;
            }

            return connection as PrinterConnectionsBambu;
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                this.statusType = StatusType.OFFLINE;
                throw new PrinterTimeOutError(error);
            } else if (error.code === 'ECONNREFUSED' || error.message.includes('Not authorized')) {
                this.statusType = StatusType.UNAUTHORIZED;
                PrinterPlugin.logger.error('Printer connection refused or not authorized:', error);
                throw new PrinterUnAuthorizedError(error);
            } else {
                this.statusType = StatusType.OFFLINE;
                PrinterPlugin.logger.error('Error getting printer connection:', error);
                throw error;
            }
        }
    }

    async getStatus()
        :
        Promise<PrinterStatus> {
        let status
            :
            PrinterStatus = {
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
            lights: [],
            image: ''
        }

        const connection = await this.getConnection();

        const response = await connection.mqtt.client.executeCommand(new PushAllCommand()).then(
            (res) => res as PushAllResponse
        ).catch((error) => {
            PrinterPlugin.logger.error('Error getting printer status:', error);
            throw new Error('Failed to get printer status');
        });

        status.bedTargetTemp = response.bed_target_temper;
        status.bedTemp = response.bed_temper;
        status.wifiSignal = response.wifi_signal;
        // use the above code to determine fan speeds
        // use this multiplier to convert the fan speeds to a percentage: round(floor(cooling_fan_speed / float(1.5)) * float(25.5));
        status.fanSpeeds = [
            {fan: 'chamber', speed: Math.round(parseInt(response.big_fan2_speed) / 1.5 * 10)},
            {fan: 'part', speed: Math.round(parseInt(response.cooling_fan_speed) / 1.5 * 10)},
            {fan: 'aux', speed: Math.round(parseInt(response.big_fan1_speed) / 1.5 * 10)}
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

    override async uploadFile(file
                              :
                              PrintWeaveFile, report
                              :
                              PrintFileReport
    ):
        Promise<PrintFileReport> {
        const connection = await this.getConnection();
        const response = await connection.ftps.connect();

        await response.uploadFile(file.path, path.join('/printweave', 'gcode', file.originalname));

        for (const plate of report.plates
            ) {
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

    async convertToReadable(webStream
                            :
                            ReadableStream<Uint8Array>
    ):
        Promise<Readable> {
        const reader = webStream.getReader();

        return new Readable({
            async read() {
                try {
                    const {done, value} = await reader.read();
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

    override async getVideoProcessor(): Promise<VideoProcessor | null> {
        const connection = await this.getConnection();
        if (!connection.video) {
            return null;
        }

        return connection.video;
    }

    async moveAxis(axis: string, distance: number): Promise<string> {
        try {
            const connection = await this.getConnection();
            if (axis.toLowerCase() === 'z' && !await this.positiveZAxis()) {
                distance = -distance;
            }

            await connection.mqtt.client.executeCommand(new MoveAxisCommand(axis, distance), false);
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            } else {
                PrinterPlugin.logger.error('Error moving axis:', error);
                throw error;
            }
        }
    }

    async homeAxes(axes: string[]): Promise<string> {
        try {
            const connection = await this.getConnection();
            await connection.mqtt.client.executeCommand(new HomeAxesCommand(axes), false);
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            } else {
                PrinterPlugin.logger.error('Error homing axes:', error);
                throw error;
            }
        }
    }

    async setTemperature(component: string, temperature: number): Promise<string> {
        try {
            const connection = await this.getConnection();

            // Check for valid nozzle index if it's a hotend
            if (component.startsWith('hotend')) {
                const nozzleIndex = parseInt(component.replace('hotend', '')) - 1;
                const {status} = await PrinterPlugin.getApp().getPrinterStatusCached(this.dataValues.printerId);

                if (isNaN(nozzleIndex) || nozzleIndex < 0 || nozzleIndex >= (status?.nozzles?.length || 0)) {
                    throw new Error(`Invalid nozzle index: ${nozzleIndex}`);
                }
            }

            await connection.mqtt.client.executeCommand(new SetTemperatureCommand(component, temperature), false)
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            } else {
                PrinterPlugin.logger.error('Error setting temperature:', error);
                throw error;
            }
        }
    }

    async setFanSpeed(fan: string, speed: number): Promise<string> {
        try {
            const connection = await this.getConnection();
            await connection.mqtt.client.executeCommand(new UpdateFanCommand({
                fan: fan === 'aux' ? Fan.AUXILIARY_FAN : fan === 'chamber' ? Fan.CHAMBER_FAN : Fan.PART_COOLING_FAN,
                speed: Math.round(Number(speed)) as NumberRange<0, 100>
            }), false);
            return 'requested';
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                return 'timeout';
            } else {
                PrinterPlugin.logger.error('Error setting fan speed:', error);
                throw error;
            }
        }
    }
}

