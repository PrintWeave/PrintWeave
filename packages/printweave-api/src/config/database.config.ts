import { Sequelize } from "sequelize-typescript";
import * as fs from "fs/promises";

import path from "path";
import BambuPrinter from "../models/printers/bambu.printer.model.js";

const db = new Sequelize({
    dialect: "sqlite",
    storage: path.resolve(process.cwd(), "printweave.db"),
    logging: console.log,
    models: [path.resolve(process.cwd(), "src/models/**/*.model.ts"), "!**/baseprinter.printer.ts"],
});

export default db;
