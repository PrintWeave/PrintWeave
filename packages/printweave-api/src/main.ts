import passport from "passport";
import jwt, {JwtPayload} from 'jsonwebtoken';
import {authRoutes} from "./routes/auth.route.js";
import createDb from "./config/database.config.js";
import dotenv from "dotenv";
import {envInt, envString} from "./environment.js";
import {apiRoutes} from "./routes/api.route.js";
import {WebSocket, WebSocketServer} from 'ws';
import {Migrations} from "./migrations.js";
import {WebsocketsManager} from "./websockets/manager.websockets.js";
import {Express as PrintWeaveExpress, User} from "@printweave/models";
import {createServer} from "node:http";
import multer from 'multer';
import * as fs from "node:fs";
import path from "path";
import {PluginManager} from "./plugins/plugin.manager.js";
import express from "express";
import {createPluginLogger, LogType} from "./logger.js";

import {
    CreatePrinterManagementMigration
} from "./migrations/20250129163025-create-printer-management-table.js";
import exp from "node:constants";

type AnyExpress = express.Express | PrintWeaveExpress;

dotenv.config({path: './.env'});

const JWT_SECRET = envString("JWT_SECRET", "");

if (!JWT_SECRET || JWT_SECRET === "") {
    throw new Error("JWT_SECRET is not defined, please set it in your .env file");
}

const port = envInt("PORT", 3000);
export const logger = createPluginLogger("API", LogType.API);

export const storage = multer({dest: envString("UPLOAD_DIR", "./tmp")});

export const pluginManager = PluginManager.getPluginManager();
const websocketsManager = new WebsocketsManager(pluginManager);

// Filter out empty strings from the plugin list
export const plugins = envString("PLUGINS", "")
    .split(',')
    .filter(plugin => plugin.trim().length > 0);

const builtInMigrations = [
    new CreatePrinterManagementMigration()
];

// Load plugins outside the reloadable function
let main: AnyExpress;
let db;
let server;
let wss;
let expressServer;

export async function loadDbAndMigrations() {
    await pluginManager.loadPlugins(plugins);

    const models = pluginManager.getPlugins().map(plugin => plugin.models).flat();

    let db = createDb(models);

    // Initialize the plugins with your Express main
    pluginManager.initializePlugins(main as unknown as PrintWeaveExpress);

    const migrations = new Migrations(db, pluginManager, builtInMigrations);
    return {migrations, db};
}

export async function getMigrationsForMigrate() {
    await pluginManager.loadPlugins(plugins);

    const models = pluginManager.getPlugins().map(plugin => plugin.models).flat();

    let db = createDb(models);

    const migrations = new Migrations(db, pluginManager, builtInMigrations);
    return {migrations, db, pluginManager};
}

/**
 * Load and initialize the server components
 * This function can be called to reload the server without reloading plugins
 */
export async function load() {
    main = express()

    // Add CORS middleware
    main.use((req, res, next) => {
        // Allow requests from the web application
        res.header('Access-Control-Allow-Origin', '*'); // Replace with specific origin in production
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    main.use(express.json());
    main.use(passport.initialize());

    // Clean up previous server instances if they exist
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }

    // Initialize auth routes
    authRoutes(main);

    // Manage printer routes
    main.use('/api', apiRoutes());

    // Get models from the already-loaded plugins
    const loadedDbAndMigrations = await loadDbAndMigrations();
    const {migrations} = loadedDbAndMigrations;

    db = loadedDbAndMigrations.db;

    const storageDir = envString("UPLOAD_DIR", "./tmp");
    fs.promises.readdir(storageDir).then(files => {
        if (files.length === 0) {
            return;
        }

        logger.info(`Removing old files from ${storageDir} directory`);

        files.forEach(file => {
            const stats = fs.statSync(path.join(storageDir, file));
            const mtime = new Date(stats.mtime);
            const now = new Date();
            const diff = Math.abs(now.getTime() - mtime.getTime());
            const minutes = Math.floor((diff / 1000) / 60);
            if (minutes > 60) {
                fs.unlink(path.join(storageDir, file), (err) => {
                    if (err) {
                        logger.error(err);
                        return;
                    }
                    logger.info(`File ${file} was deleted`);
                });
            }
        });

        logger.info('Old files removed');
    });

    await db.authenticate();

    logger.info('Database connected');

    // Check if migrations are pending
    if ((await migrations.pending()).length > 0) {
        process.on('exit', () => {
            logger.info('------------------------------------');
            logger.info('Migrations pending, please run: printweave migrate');
            logger.info('------------------------------------');
        });

        process.exit(1);
    }

    // Start server
    expressServer = main.listen(port, () => logger.info('Server running on port ' + port));

    server = createServer(main);
    wss = new WebSocketServer({
        noServer: true
    });

    server.on('upgrade', async (request, socket, head) => {
        const token = extractTokenFromRequest(request);
        const user = await token ? await authenticate(token) : null;

        if (!user) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, user);
        });
    });

    server.listen(envInt("WEBSOCKET_PORT", 3001));

    logger.info('Websockets server running on port ' + envInt("WEBSOCKET_PORT", 3001));

    wss.on('connection', (ws: WebSocket, req, user: User) => {
        ws.on('message', async (message) => {
            await websocketsManager.handleMessage(ws, message, user);
        });

        ws.send('Connected to Printweave API');
    });

    return { server, wss, db, expressServer };
}

/**
 * Unload and clean up server components
 * This function properly shuts down all server instances and connections
 */
export async function unload() {
    logger.info('Unloading server components...');

    // Close express server
    if (expressServer) {
        await new Promise(resolve => expressServer.close(resolve));
        logger.info('Express server stopped');
    }

    // Close websocket server
    if (server) {
        await new Promise(resolve => server.close(resolve));
        logger.info('Websocket server stopped');
    }

    // Close all websocket connections
    if (wss) {
        wss.clients.forEach(client => {
            client.terminate();
        });
        wss.close();
        logger.info('All websocket connections closed');
    }

    // Close database connection if needed
    if (db && db.close) {
        await db.close();
        logger.info('Database connection closed');
    }

    logger.info('Server successfully unloaded');
}

/**
 * Reload the server by unloading then loading again
 * This function restarts all server components without reloading plugins
 */
export async function reload() {
    logger.info('Reloading server...');
    await unload();
    const result = await load();
    logger.info('Server successfully reloaded');
    return result;
}

function extractTokenFromRequest(request) {
    const authHeader = request.headers.authorization;
    return authHeader ? authHeader.split(' ')[1] : null;
}

const authenticate = async (token: string): Promise<User | null> => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return await User.findByPk(decoded.id);
    } catch {
        return null;
    }
};
