import {IUserPrinter} from "./UserPrinter";
import {IModel} from "./Model";

export interface IPrinter extends IModel {
    name: string;
    type: 'bambu' | 'other';
    active: boolean;
    userPrinter?: IUserPrinter
}

export interface PrinterStatus {
    bedTemp: number;
    bedTargetTemp: number;
    wifiSignal: `-${number}dBm`;
    fanSpeeds: FanSpeed[];
    nozzles: PrinterNozzle[];
    status: "FINISH" | "FAILED" | "RUNNING" | "IDLE" | "PAUSE" | "PREPARE" | "SLICING";
    gcode_file: string;
    progress: PrintProgress;
    lights: Light[]
}

export interface Light {
    name: string;
    status: "on" | "off";
}

export interface FanSpeed {
    fan: "chamber" | "part" | "aux";
    speed: number;
}
export interface FilamentType {
    type: string;
    color: string;
    nozzleTemp: FilamentTemperature;
    bedTemp: FilamentTemperature;
    dryTemp: number;
    dryTime: number;
    weight: number;
    diameter: number;
}
export interface FilamentTemperature {
    minTemp: number;
    maxTemp: number;
}
export interface PrinterNozzle {
    id: number;
    nozzleTemp: number;
    nozzleTargetTemp: number;
    currentFilament: FilamentType;
    multiMaterials: MultiMaterial[];
    diameter: number;
    type: "Brass" | "Stainless Steel";
}
export interface MultiMaterial {
    type: "single" | "multi";
    humidity?: number;
    temperature?: number;
    id: number;
    trays: MultiMaterialTray[];
}
export interface MultiMaterialTray {
    id: number;
    material: FilamentType;
}
export interface PrintProgress {
    percentage: number;
    timeLeft: number;
    totalLayers?: number;
    layer?: number;
}
