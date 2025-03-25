import {Express} from "express";
import {PluginManager} from "./plugin.manager.js";

export interface Plugin {
    registerRoutes(app: Express): void;
    initializeEvents(manager: PluginManager): void;
}
