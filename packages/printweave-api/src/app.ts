import express from "express";
import passport from "passport";
import {authMiddleware, authRoutes} from "./routes/auth.route.js";
import db from "./config/database.config.js";
import dotenv from "dotenv";
import {envInt} from "./environment.js";
import {apiRoutes} from "./routes/api.route.js";
import {User} from "./models/user.model.js";
import {Printer} from "./models/printer.model.js";
import { Umzug } from "umzug";
import { umzug } from "./migrations.js";

dotenv.config({ path: '../.env' });

const port = envInt("SERVER_PORT", 3000);
const app = express();

app.use(express.json());
app.use(passport.initialize());

// Initialize auth routes
authRoutes(app);

// Manage printer routes
app.use('/api', apiRoutes());

(async () => {
    console.log('Current working directory:', process.cwd());
    
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
})();
