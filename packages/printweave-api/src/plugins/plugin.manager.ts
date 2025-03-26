import {EventEmitter} from "events";
import {IPluginManager, Plugin, Express} from "@printweave/models";

export class PluginManager extends EventEmitter implements IPluginManager {
    private plugins: Plugin[] = [];

    registerPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    initializePlugins(app: Express) {
        this.plugins.forEach(plugin => plugin.registerRoutes(app));
    }
}
