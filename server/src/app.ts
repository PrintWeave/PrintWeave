import express from "express";
import passport from "passport";
import {authMiddleware, authRoutes} from "./routes/auth.route";
import db from "./config/database.config";
import dotenv from "dotenv";
import {envInt} from "./environment";
import {apiRoutes} from "./routes/api.route";
import {User} from "./models/user.model";
import {Printer} from "./models/printer.model";

dotenv.config({ path: '../.env' });

(async () => {
    await db.query('PRAGMA foreign_keys = false;');
    await db.sync({alter: true}).then(() => {
        console.log('Connected to database');
    });
    await db.query('PRAGMA foreign_keys = true;');
})();

const port = envInt("SERVER_PORT", 3000);
const app = express();

app.use(express.json());
app.use(passport.initialize());

// Initialize auth routes
authRoutes(app);

// Manage printer routes
app.use('/api', apiRoutes());

// Start server
app.listen(port, () => console.log('Server running on port ' + port));
