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

type AnyExpress = express.Express | PrintWeaveExpress;

const JWT_SECRET = process.env.SECRET_KEY || 'your_secure_secret_key';

dotenv.config({path: './.env'});

const port = envInt("PORT", 3000);
const main: AnyExpress = express()
export const logger = createPluginLogger("API", LogType.API);

export const storage = multer({dest: envString("UPLOAD_DIR", "./tmp")});

main.use(express.json());
main.use(passport.initialize());

// Initialize auth routes
authRoutes(main);

// Manage printer routes
main.use('/api', apiRoutes());

const pluginManager = PluginManager.getPluginManager();

// Filter out empty strings from the plugin list
const plugins = envString("PLUGINS", "")
    .split(',')
    .filter(plugin => plugin.trim().length > 0);

// Load the plugins from npm
await pluginManager.loadPlugins(plugins);

const models = pluginManager.getPlugins().map(plugin => plugin.getModels()).flat();
const db = createDb(models);

// Initialize the plugins with your Express main
pluginManager.initializePlugins(main as unknown as PrintWeaveExpress);

const migrations = new Migrations(db);

(async () => {
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
                        console.error(err);
                        return;
                    }
                    logger.info(`File ${file} was deleted`);
                });
            }
        });

        logger.info('Old files removed');
    })

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
    main.listen(port, () => logger.info('Server running on port ' + port));

    const server = createServer(main);
    const wss = new WebSocketServer({
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

    // Helper to extract token from request

    logger.info('Websockets server running on port ' + envInt("WEBSOCKET_PORT", 3001));

    wss.on('connection', (ws: WebSocket, req, user: User) => {
        ws.on('message', async (message) => {
            await WebsocketsManager.getWebsocketsManager().handleMessage(ws, message, user);
        });

        ws.send('Connected to Printweave API');
    });


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

})();
