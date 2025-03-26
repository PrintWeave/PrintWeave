import {Express} from "express";
import {BasePrinter} from "./base.printer.js";
import e from "express";

export interface Plugin {
    registerRoutes(app: Express): void;
    initializeEvents(manager: IPluginManager): void;

    createPrinter(options: any): BasePrinter;
}

export interface IPluginManager {



    registerPlugin(plugin: Plugin): void;
    initializePlugins(app: e.Express): void;
}
