import dotenv from "dotenv";
import db from "./config/database.config.ts";
import {User} from "./models/user.model.ts";
import bcrypt from "bcryptjs";

dotenv.config({path: '../.env'});

db.sync().then(() => {
    console.log('Connected to database');
});

(async () => {
    const allUsers = await User.findAll();

    if (allUsers.length !== 0) {
        console.log('Database is not empty');
        process.exit(1);
    }

    // TODO: Add prompt to create admin user
    const username = 'admin';
    const password = 'admin';
    const email = 'admin@example.com';

    const hash = await bcrypt.hash(password, 10);

    await User.create({
        username: username,
        password: hash,
        email: email,
        role: 'admin',
        active: true,
    });
})();

