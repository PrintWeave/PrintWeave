import {StopPrintCommand} from "./mqtt/StopPrintCommand.js";
import {OwnBambuClient} from "./mqtt/OwnBambuClient.js";
import {PausePrintCommand} from "./mqtt/PausePrintCommand.js";
import {ResumePrintCommand} from "./mqtt/ResumePrintCommand.js";
import {AMS, AMSTray, GetVersionCommand} from "bambu-node";
import {EventEmitter} from "events";
import PrinterPlugin from "../main.js";
import {BambuWebsocketConnection} from "websockets.manager.js";
import {Filament, Light, MultiMaterial} from "@printweave/api-types";

export class MqttBambuConnection {

    client: OwnBambuClient;
    status: string = 'OFFLINE';
    printerId: number;

    constructor(ip: string, code: string, serial: string, printerId: number) {
        this.printerId = printerId;

        this.client = new OwnBambuClient({
            host: ip,
            accessToken: code,
            serialNumber: serial
        })

        this.client.on("printer:statusUpdate", (oldStatus, newStatus) => {
            PrinterPlugin.logger.info(`Printer with id: ${printerId} status changed from ${oldStatus} to ${newStatus}`);
            this.status = newStatus;
        })

        this.client.on("rawMessage", async (topic, message) => {
            const data = JSON.parse(message.toString());

            PrinterPlugin.logger.info(`Printer with id: ${printerId} received raw message: ${topic} - ${message.toString()}`);

            const firstKey = Object.keys(data)[0];
            const topicName = `${firstKey}.${data[firstKey].command}`;

            PrinterPlugin.getInstance().getBambuWebsocketSubscriptionManager().sendMessageToAll(JSON.stringify({
                message: 'mqtt',
                printerId: this.printerId,
                mqtt: {
                    command: topicName,
                    data: data
                }
            }));

            PrinterPlugin.getInstance().getBambuWebsocketSubscriptionManager().sendMessageToFiltered(JSON.stringify({
                message: 'mqtt',
                printerId: this.printerId,
                mqtt: {
                    command: topicName,
                    data: data
                }
            }), (subscriber) => {
                return subscriber.printerId === this.printerId;
            })

            PrinterPlugin.logger.info(`Printer with id: ${this.printerId} received message on topic: ${topicName}`, data);

            if (topicName === 'print.push_status') {
                await this.updatePrinterStatus(data[firstKey]);
            }
        });
    }

    async updatePrinterStatus(response: any) {
        const printer = await PrinterPlugin.getApp().getPrinter(this.printerId);

        const status = await PrinterPlugin.getApp().getPrinterStatusFromCache(this.printerId);
        if (!status) {
            PrinterPlugin.logger.warn(`No printer status found for printer with id: ${this.printerId}`);
            return;
        }

        if (response.bed_target_temper !== undefined) status.bedTargetTemp = response.bed_target_temper;
        if (response.bed_temper !== undefined) status.bedTemp = response.bed_temper;
        if (response.wifi_signal !== undefined) status.wifiSignal = response.wifi_signal;
        if (
            response.big_fan2_speed !== undefined ||
            response.cooling_fan_speed !== undefined ||
            response.big_fan1_speed !== undefined
        ) {
            status.fanSpeeds = [
                {fan: 'chamber', speed: response.big_fan2_speed !== undefined ? parseInt(response.big_fan2_speed) : status.fanSpeeds?.[0]?.speed ?? 0},
                {fan: 'part', speed: response.cooling_fan_speed !== undefined ? parseInt(response.cooling_fan_speed) : status.fanSpeeds?.[1]?.speed ?? 0},
                {fan: 'aux', speed: response.big_fan1_speed !== undefined ? parseInt(response.big_fan1_speed) : status.fanSpeeds?.[2]?.speed ?? 0}
            ];
        }

        if (response.gcode_state !== undefined) status.status = response.gcode_state;
        if (response.gcode_file !== undefined) status.gcode_file = response.gcode_file;

        if (
            response.mc_percent !== undefined ||
            response.mc_remaining_time !== undefined ||
            response.layer_num !== undefined ||
            response.total_layer_num !== undefined
        ) {
            status.progress = {
                percentage: response.mc_percent !== undefined ? response.mc_percent : status.progress?.percentage ?? 0,
                timeLeft: response.mc_remaining_time !== undefined ? response.mc_remaining_time : status.progress?.timeLeft ?? 0,
                layer: response.layer_num !== undefined ? response.layer_num : status.progress?.layer ?? 0,
                totalLayers: response.total_layer_num !== undefined ? response.total_layer_num : status.progress?.totalLayers ?? 0
            };
        }

        if (response.lights_report !== undefined) {
            status.lights = response.lights_report.map(
                light => ({
                    name: light.node,
                    status: light.mode === 'on' ? 'on' : 'off'
                } as Light)
            );
        }

        const getFilamentType = (response: AMSTray): Filament => {
            if (!response?.tray_type) {
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
        const trayTar = response.ams?.tray_tar !== undefined ? parseInt(response.ams.tray_tar) : undefined;

        if (trayTar === 254) {
            currentFilament = getFilamentType(response.vt_tray);
        } else if (trayTar === 255) {
            currentFilament = null;
        } else if (trayTar !== undefined) {
            const amsIndex = Math.floor(trayTar / 4);
            const trayIndex = trayTar % 4;
            let am = response.ams.ams?.[amsIndex];
            currentFilament = getFilamentType(am?.tray?.[trayIndex]);
        }

        if (
            response.nozzle_temper !== undefined ||
            response.nozzle_target_temper !== undefined ||
            response.vt_tray !== undefined ||
            response.ams?.ams !== undefined
        ) {
            status.nozzles = [
                {
                    id: 0,
                    nozzleTemp: response.nozzle_temper !== undefined ? response.nozzle_temper : status.nozzles?.[0]?.nozzleTemp ?? 0,
                    nozzleTargetTemp: response.nozzle_target_temper !== undefined ? response.nozzle_target_temper : status.nozzles?.[0]?.nozzleTargetTemp ?? 0,
                    multiMaterials: [
                        {
                            id: 0,
                            type: 'single',
                            trays: [{
                                id: 0,
                                material: getFilamentType(response.vt_tray)
                            }]
                        },
                        ...(response.ams?.ams || []).map((am: AMS, index: number) => ({
                            id: index + 1,
                            type: 'multi',
                            humidity: am.humidity !== undefined ? parseInt(am.humidity) : 0,
                            trays: (am.tray || []).map((tray, trayIndex) => ({
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
        }

        PrinterPlugin.logger.info(`Updating printer status for printer with id: ${this.printerId}`, status);
        PrinterPlugin.getApp().setPrinterStatusCache(printer, {status: status, statusType: null});
    }

    async connect() {
        await this.client.connect();
    }
}
