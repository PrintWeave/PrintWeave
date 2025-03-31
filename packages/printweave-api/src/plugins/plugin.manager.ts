// In packages/printweave-api/src/plugins/plugin.manager.ts
import {EventEmitter} from "events";
import {Express as PrintWeaveExpress, IPluginManager, Plugin} from "@printweave/models";
import path from "path";
import fs from 'fs/promises';
import {execFile} from "node:child_process";
import {pathToFileURL} from "node:url";
import chokidar from 'chokidar';
import {App} from "../app.js";
import winston from "winston";
import {createPluginLogger, LogType} from "../logger.js";
import {logger, reload} from "../main.js";

export class PluginManager extends EventEmitter implements IPluginManager {
    private plugins: Plugin[] = [];

    private pluginsDir: string;
    private pluginPackages: string[] = [];
    private isDevMode: boolean = false;
    public app: App = new App(this);

    private static instance: PluginManager;

    static getPluginManager(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    constructor() {
        super();
        this.pluginsDir = path.join(process.cwd(), 'plugins');
        this.isDevMode = process.env.NODE_ENV === 'development';
    }

    getPlugins(): Plugin[] {
        return this.plugins;
    }

    getPlugin(type: string): Plugin | undefined {
        return this.plugins.find(plugin => plugin.printerType === type);
    }

    registerPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
        logger.info(`Plugin ${plugin.name || 'unnamed'} registered`);
    }

    initializePlugins(app: PrintWeaveExpress): void {
        logger.info(`Initializing ${this.plugins.length} plugins`);

        // Initialize routes
        this.plugins.forEach(plugin => plugin.registerRoutes(app as PrintWeaveExpress));

        // Initialize events
        this.plugins.forEach(plugin => plugin.initializeEvents(this));

        this.emit('plugins:initialized');
    }

    async loadPlugins(pluginNames: string[]) {
        this.pluginPackages = pluginNames;

        logger.info(`Loading plugins: ${pluginNames.join(', ') || 'none'}`);

        const installedPlugins = await this.getInstalledPlugins();

        // Uninstall plugins no longer in PLUGINS env
        for (const installedPlugin of installedPlugins) {
            if (!this.pluginPackages.map((p) => p.trim()).includes(installedPlugin)) {
                try {
                    await this.uninstallPackage(installedPlugin);
                } catch (error) {
                    logger.error(`Error uninstalling ${installedPlugin}:`, error);
                }
            }
        }

        this.plugins = []; // Reset the plugins array
        for (const packageName of this.pluginPackages) {
            const trimmedPackageName = packageName.trim();
            try {
                await this.installPackage(trimmedPackageName);

                const plugin = await this.loadPlugin(packageName);
                this.plugins.push(plugin);

                if (this.isDevMode) {
                    this.watchPlugin(packageName); // Start watching for changes
                }
            } catch (error) {
                logger.error(`Error loading plugin ${trimmedPackageName}:`, error);
            }
        }
    }

    private async installPackage(packageName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            execFile('npm', ['install', packageName, '--prefix', this.pluginsDir], {shell: true}, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error installing ${packageName}: ${error}`);
                    reject(error);
                    return;
                }
                logger.info(`Installed ${packageName}`);
                resolve();
            });
        });
    }

    private async uninstallPackage(packageName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            execFile('npm', ['uninstall', packageName, '--prefix', this.pluginsDir], {shell: true}, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error uninstalling ${packageName}: ${error}`);
                    reject(error);
                    return;
                }
                logger.info(`Uninstalled ${packageName}`);
                resolve();
            });
        });
    }

    private async getPackageEntryPoint(packageName: string): Promise<string> {
        let packagePath: string;

        if (packageName.startsWith('file://') || packageName.startsWith('.')) {
            packagePath = path.join(process.cwd(), packageName);
        } else {
            packagePath = path.join(this.pluginsDir, 'node_modules', packageName);
        }

        const packageJsonPath = path.join(packagePath, 'package.json');

        logger.info(`Reading package.json from ${packageJsonPath}`);

        try {
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonContent as string);

            if (!packageJson.main && !packageJson.module) {
                throw new Error(`Package ${packageName} does not have a "main" or "module" entry`);
            }

            // Prefer "module" if available (for ES modules)
            const entryPoint: string = packageJson.module || packageJson.main;

            return path.join(packagePath, entryPoint);
        } catch (error) {
            logger.error(`Error reading package.json for ${packageName}:`, error);
            throw error;
        }
    }

    private async getInstalledPlugins(): Promise<string[]> {
        try {
            const pluginPackageJsonPath = path.join(this.pluginsDir, 'package.json');
            const pluginPackageJsonContent = await fs.readFile(
                pluginPackageJsonPath,
                'utf-8'
            );
            const pluginPackageJson = JSON.parse(pluginPackageJsonContent);
            const installedPlugins = Object.keys(pluginPackageJson.dependencies || {});

            // Normalize plugin names in package.json (remove "file:" prefix from local paths)
            return installedPlugins.map(pluginName => {
                if (pluginName.startsWith('file:')) {
                    return path.basename(pluginName);
                }
                return pluginName;
            });
        } catch (error) {
            console.warn(
                'Could not read plugins/package.json, assuming no plugins installed.'
            );
            return [];
        }
    }

    private async isPluginsDirEmpty(): Promise<boolean> {
        try {
            await fs.access(path.join(this.pluginsDir, 'node_modules'));
            return false; // Directory exists
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return true; // Directory does not exist
            }
            throw error; // Other error
        }
    }

    private async loadPlugin(packageName: string): Promise<Plugin> {
        try {
            const entryPoint = await this.getPackageEntryPoint(packageName);
            const fileUrl = pathToFileURL(entryPoint).toString();
            logger.info(`Loading plugin from ${fileUrl}`);
            const plugin: Plugin = new ((await import(fileUrl)).default)(createPluginLogger(packageName, LogType.PLUGIN), this);
            logger.info(`Plugin loaded: ${packageName} from ${fileUrl}`);
            return plugin;
        } catch (error) {
            logger.error(`Error loading plugin ${packageName}:`, error);
            throw error; // Re-throw to be caught in loadPlugins
        }
    }

    private async watchPlugin(packageName: string): Promise<void> {
        if (!this.isDevMode) return;

        // Determine the actual path based on whether it's local or remote
        let packagePath = path.join(this.pluginsDir, 'node_modules', packageName);
        // Handle the cases where the package name starts with a directory
        if (packageName.startsWith('file://') || packageName.startsWith('.')) {
            // It is a local plugin and resolve the package path
            packagePath = path.join(process.cwd(), packageName);

        } else {
            packagePath = path.join(this.pluginsDir, 'node_modules', packageName);

        }

        logger.info(`Watching for changes in plugin: ${packageName} at ${packagePath}`);

        // Add debounce mechanism to prevent multiple rapid reloads
        let reloadTimeout: NodeJS.Timeout | null = null;
        const debounceTime = 1000; // 1 second debounce time

        chokidar.watch(packagePath, {
            ignored: /(^|[/\\])\../, // Ignore dotfiles
            persistent: true
        }).on('change', async (filePath) => {
            logger.info(`File changed: ${filePath}`);

            // Clear previous timeout if it exists
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }

            // Set a new timeout
            reloadTimeout = setTimeout(async () => {
                try {
                    // Reload the plugin
                    const plugin = await this.loadPlugin(packageName);
                    // Replace the old plugin with the new one
                    const index = this.plugins.findIndex(p => p.name === plugin.name);
                    if (index !== -1) {
                        this.plugins[index] = plugin;

                        // reload entire app
                        await reload();

                        logger.info(`Plugin ${packageName} reloaded successfully`);
                    } else {
                        logger.warn(`Plugin ${packageName} not found in the list`);
                    }
                } catch (error) {
                    logger.error(`Error reloading plugin ${packageName}:`, error);
                }
            }, debounceTime);
        });
    }

    logger: winston.Logger;
}
