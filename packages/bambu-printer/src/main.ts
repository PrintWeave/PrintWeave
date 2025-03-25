import {Plugin} from "@printweave/api/dist/plugins/plugin.interface.js";
import {PluginManager} from "@printweave/api/dist/plugins/plugin.manager.js";
import * as e from "express";

export class PrinterPlugin implements Plugin {
    initializeEvents(manager: PluginManager): void {

    }

    registerRoutes(app: e.Express): void {

    }
}
