// In packages/printweave-api/src/plugins/plugin.manager.ts
import {EventEmitter} from "events";
import {IPluginManager, Plugin, Express} from "@printweave/models";
import path from "path";
import fs from "fs";

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

    async loadPlugins(pluginNames: string[]) {
        console.log(`Loading plugins: ${pluginNames.join(', ') || 'none'}`);

        for (const pluginName of pluginNames) {
            if (!pluginName.trim()) continue;

            try {
                // Try to load the plugin as an npm package
                const pluginPackage = await import(pluginName);

                // Check if the package exports a Plugin constructor or instance
                if (pluginPackage.default) {
                    // It could be a constructor function or class
                    if (typeof pluginPackage.default === 'function') {
                        const PluginClass = pluginPackage.default;
                        this.registerPlugin(new PluginClass());
                    }
                    // It could be a plugin instance
                    else if (this.isValidPlugin(pluginPackage.default)) {
                        this.registerPlugin(pluginPackage.default);
                    } else {
                        console.error(`Plugin ${pluginName} does not export a valid Plugin instance or constructor`);
                    }
                } else {
                    console.error(`Plugin ${pluginName} does not have a default export`);
                }
            } catch (error) {
                console.error(`Failed to load plugin ${pluginName}:`, error);
            }
        }
    }

    private isValidPlugin(plugin: any): plugin is Plugin {
        return plugin &&
            typeof plugin.registerRoutes === 'function' &&
            typeof plugin.initializeEvents === 'function';
    }
}
