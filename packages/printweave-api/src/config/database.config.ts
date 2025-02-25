import { Sequelize } from "sequelize-typescript";
import * as fs from "fs/promises";

import path from "path";
import BambuPrinter from "../models/printers/bambu.printer.model.js";
import User from "../models/user.model.js";
import Printer from "../models/printer.model.js";
import UserPrinter from "../models/userprinter.model.js";

const db = new Sequelize({
    dialect: "sqlite",
    storage: path.resolve(process.cwd(), "printweave.sqlite"),
    logging: false,
    models: [User, Printer, BambuPrinter, UserPrinter]
});

export default db;
