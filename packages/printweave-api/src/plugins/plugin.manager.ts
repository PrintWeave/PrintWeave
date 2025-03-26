import {EventEmitter} from "events";
import {IPluginManager, Plugin, Express} from "@printweave/models";

export class PluginManager extends EventEmitter implements IPluginManager {
    private plugins: Plugin[] = [];

    registerPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
        console.log(`Plugin ${plugin.name || 'unnamed'} registered`);
    }

    initializePlugins(app: Express) {
        console.log(`Initializing ${this.plugins.length} plugins`);

        // Initialize routes
        this.plugins.forEach(plugin => plugin.registerRoutes(app));

        // Initialize events
        this.plugins.forEach(plugin => plugin.initializeEvents(this));

        this.emit('plugins:initialized');
    }
}
