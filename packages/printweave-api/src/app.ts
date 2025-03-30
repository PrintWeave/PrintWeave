import passport from "passport";
import jwt, {JwtPayload} from 'jsonwebtoken';
import {authRoutes} from "./routes/auth.route.js";
import db from "./config/database.config.js";
import dotenv from "dotenv";
import {envInt, envString} from "./environment.js";
import {apiRoutes} from "./routes/api.route.js";
import {WebSocketServer, WebSocket} from 'ws';
import {umzug} from "./migrations.js";
import {WebsocketsManager} from "./websockets/manager.websockets.js";
import {User} from "@printweave/models";
import {createServer} from "node:http";
import multer from 'multer';
import * as fs from "node:fs";
import path from "path";
import {PluginManager} from "./plugins/plugin.manager.js";
import {PrintWeaveExpress, express} from "@printweave/models";

const JWT_SECRET = process.env.SECRET_KEY || 'your_secure_secret_key';

dotenv.config({path: './.env'});

const port = envInt("PORT", 3000);
const app = express() as PrintWeaveExpress.Express;

export const storage = multer({dest: envString("UPLOAD_DIR", "./tmp")});

app.use(express.json());
app.use(passport.initialize());

// Initialize auth routes
authRoutes(app);

// Manage printer routes
app.use('/api', apiRoutes());

const pluginManager = new PluginManager();

// Filter out empty strings from the plugin list
const plugins = envString("PLUGINS", "")
    .split(',')
    .filter(plugin => plugin.trim().length > 0);

// Load the plugins from npm
await pluginManager.loadPlugins(plugins);

// Initialize the plugins with your Express app
pluginManager.initializePlugins(app as PrintWeaveExpress);


(async () => {
    const storageDir = envString("UPLOAD_DIR", "./tmp");
    fs.promises.readdir(storageDir).then(files => {
        if (files.length === 0) {
            return;
        }

        console.log(`Removing old files from ${storageDir} directory`);

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
                    console.log(`File ${file} was deleted`);
                });
            }
        });

        console.log('Old files removed');
    })

    await db.authenticate();

    console.log('Database connected');

    // Check if migrations are pending
    if ((await umzug.pending()).length > 0) {
        process.on('exit', () => {
            console.log('------------------------------------');
            console.log('Migrations pending, please run: printweave migrate');
            console.log('------------------------------------');
        });

        process.exit(1);
    }

    // Start server
    app.listen(port, () => console.log('Server running on port ' + port));

    const server = createServer(app);
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

    console.log('Websockets server running on port ' + envInt("WEBSOCKET_PORT", 3001));

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
