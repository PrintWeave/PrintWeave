import { Sequelize } from "sequelize-typescript";
import * as fs from "fs/promises";

import path from "path";
import { User, Printer, UserPrinter } from "@printweave/models";

const db = new Sequelize({
    dialect: "sqlite",
    storage: path.resolve(process.cwd(), "printweave.sqlite"),
    logging: false,
    // TODO: Register Plugin Models
    models: [User, Printer, UserPrinter]
});

export default db;
