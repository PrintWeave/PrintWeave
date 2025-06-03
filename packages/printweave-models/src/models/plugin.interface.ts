import {Express} from "express";
import {BasePrinter} from "./base.printer.js";
import {IPrintWeaveApp} from "./printweave.app.js";
import {ModelStatic, Sequelize} from "sequelize";
import {ModelCtor} from "sequelize-typescript";
import {Logger} from "winston";
import {BaseWebsocketManager} from "./websockets.model.js";
import {RunnableMigration} from "umzug";
import {VideoProcessor} from "./video.model.js";
// import {BaseWebsocketManager} from "./websockets.js";

export * as Sequelize from "sequelize";
export {ModelStatic} from "sequelize";
export {RunnableMigration, MigrationParams} from "umzug";
export {Model, ModelCtor} from "sequelize-typescript";
export {Logger} from "winston";

export interface IPluginManager {
    registerPlugin(plugin: Plugin): void;
    initializePlugins(app: Express): void;

    getPlugins(): Plugin[];

    app: IPrintWeaveApp;
}

export abstract class Plugin {
    abstract name: string;
    abstract printerType: string;
    abstract printerClass : ModelStatic<BasePrinter>
    abstract registerRoutes(app: Express): void;
    abstract initializeEvents(manager: IPluginManager): void;
    abstract models: ModelCtor[];
    abstract websocketManagers: BaseWebsocketManager[];

    abstract buildPrinter(options: any): BasePrinter;
    abstract savePrinter(printer: BasePrinter): Promise<BasePrinter>;

    static logger: Logger;
    static pluginManager: IPluginManager;

    abstract migrations: RunnableMigration<Sequelize>[];

    constructor(logger: Logger, pluginManager: IPluginManager) {
        Plugin.logger = logger;
        Plugin.pluginManager = pluginManager;
    }
}
