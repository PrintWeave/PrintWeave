import express from "express";
import passport from "passport";
import {authMiddleware, authRoutes} from "./routes/auth.route.js";
import db from "./config/database.config.js";
import dotenv from "dotenv";
import {envInt} from "./environment.js";
import {apiRoutes} from "./routes/api.route.js";
import {User} from "./models/user.model.js";
import {Printer} from "./models/printer.model.js";

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
    await db.authenticate();

    await db.query('PRAGMA foreign_keys = false;');
    await db.sync({alter: true}).then(() => {
        console.log('Connected to database');
    });
    await db.query('PRAGMA foreign_keys = true;');

    // Start server
    app.listen(port, () => console.log('Server running on port ' + port));
})();
