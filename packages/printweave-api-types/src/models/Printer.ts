import {IUserPrinter} from "./UserPrinter";
import {IModel} from "./Model";

export interface IPrinter extends IModel {
    id: number;
    name: string;
    type: string;
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
    lights: Light[];
    image: string;
}

export enum StatusType {
    OFFLINE = 'offline',
    ONLINE = 'online',
    PRINTING = 'printing',
    PAUSED = 'paused',
    ERROR = 'error',
    UNAUTHORIZED = 'unauthorized'
}

export interface Light {
    name: string;
    status: "on" | "off";
}

export interface FanSpeed {
    fan: "chamber" | "part" | "aux" | string;
    name?: string;
    speed: number;
}

export declare enum FilamentType {
    PLA = "PLA",
    ABS = "ABS",
    TPU = "TPU",
    PC = "PC",
    ASA = "ASA",
    PA_CF = "PA-CF",
    PA6_CF = "PA6-CF",
    PET_CF = "PET-CF",
    PETG = "PETG",
    PETG_CF = "PETG-CF",
    PLA_AERO = "PLA-AERO",
    PLA_CF = "PLA-CF",
    PPA_CF = "PPA-CF",
    PPA_GF = "PPA-GF",
    PA = "PA",
    HIPS = "HIPS",
    PPS = "PPS",
    PPS_CF = "PPS-CF",
    PVA = "PVA",
    PLA_S = "PLA-S",
    PA_S = "PLA-S"
}

export interface Filament {
    type: FilamentType;
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
    currentFilament?: Filament;
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
    material: Filament;
}

export interface PrintProgress {
    percentage: number;
    timeLeft: number;
    totalLayers?: number;
    layer?: number;
}
