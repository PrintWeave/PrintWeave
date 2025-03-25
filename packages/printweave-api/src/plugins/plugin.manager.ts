import {Express} from "express";
import {Plugin} from "./plugin.interface.js";
import {EventEmitter} from "events";

export class PluginManager extends EventEmitter {
    private plugins: Plugin[] = [];

    registerPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    initializePlugins(app: Express) {
        this.plugins.forEach(plugin => plugin.registerRoutes(app));
    }
}
