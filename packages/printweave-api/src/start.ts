import {load, pluginManager, plugins} from './main.js';

// Load plugins once at startup
(async () => {
    // Load the plugins from npm
    await pluginManager.loadPlugins(plugins);

    // Initial server load
    await load();
})();
