import { Sequelize, DataType, DataTypes, QueryTypes } from "sequelize";
import * as fs from "fs/promises";

import path from "path";

const db = new Sequelize({
    dialect: "sqlite",
    storage: path.resolve(process.cwd(), "printweave.db"),
    logging: console.log
});

export default db;
