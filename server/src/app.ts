import express from "express";
import passport from "passport";
import {authMiddleware, authRoutes} from "./routes/auth.route";
import db from "./config/database.config";
import dotenv from "dotenv";
import {envInt} from "./environment";
import {apiRoutes} from "./routes/api.route";

dotenv.config({ path: '../.env' });

db.sync().then(() => {
    console.log('Connected to database');
});

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
