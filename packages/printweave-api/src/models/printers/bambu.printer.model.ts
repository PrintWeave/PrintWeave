import {Table, Column, DataType} from 'sequelize-typescript';
import {BasePrinter} from './base.printer.js';
import {ConnectionManager, PrinterConnectionsBambu} from '../../connections/manager.connection.js';
import {
    AMS,
    AMSTray,
    GetVersionCommand,
    GetVersionResponse,
    PrintMessage,
    PrintMessageCommand,
    PushAllCommand,
    PushAllResponse
} from 'bambu-node';
import {OwnPrintMessageCommand} from '../../connections/bambu/mqtt/OwnBambuClient.js';
import {PausePrintCommand} from '../../connections/bambu/mqtt/PausePrintCommand.js';
import {ResumePrintCommand} from '../../connections/bambu/mqtt/ResumePrintCommand.js';
import {StopPrintCommand} from '../../connections/bambu/mqtt/StopPrintCommand.js';
import {Light, PrinterStatus, Filament, MultiMaterial} from "@printweave/api-types";

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

    async getStatus(): Promise<PrinterStatus> {
        let status: PrinterStatus = {
            bedTargetTemp: 0,
            bedTemp: 0,
            fanSpeeds: [],
            gcode_file: "",
            nozzles: [],
            progress: undefined,
            status: undefined,
            wifiSignal: '-0dBm',
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
        }

        status.lights = response.lights_report.map(
            light => ({
                name: light.node,
                status: light.mode === 'on' ? 'on' : 'off'
            } as Light)
        )

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
        }

        let currentFilament: Filament = null
        const trayTar = parseInt(response.ams.tray_tar);

        if (trayTar === 254) {
            currentFilament = getFilamentType(response.vt_tray);
        } else if (trayTar === 255) {
            currentFilament = null;
        } else {
            const amsIndex = Math.floor(trayTar / 4);
            console.log("amsIndex", amsIndex);
            const trayIndex = trayTar % 4;
            let am = response.ams.ams[amsIndex];
            currentFilament = getFilamentType(am.tray[trayIndex]);
        }

        // TODO: Implement nozzles and current filament
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
        ]

        return status;
    };
}

export class PrinterTimeOutError extends Error {
    constructor(error: Error) {
        super(error.message);
        this.name = 'PrinterTimeOutError';
    }
}

export default BambuPrinter;
