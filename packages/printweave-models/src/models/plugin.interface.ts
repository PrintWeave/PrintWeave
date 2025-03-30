import {Express} from "express";

export interface IPluginManager {
    registerPlugin(plugin: Plugin): void;
    initializePlugins(app: Express): void;
}

export interface Plugin {
    name?: string;
    registerRoutes(app: Express): void;
    initializeEvents(manager: IPluginManager): void;
}
