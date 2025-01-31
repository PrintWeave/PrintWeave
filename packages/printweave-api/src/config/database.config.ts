import { Sequelize, DataType, DataTypes, QueryTypes } from "sequelize";
import * as fs from "fs/promises";

const db = new Sequelize({
    dialect: "sqlite",
    storage: "./db.sqlite",
    logging: console.log
});

export default db;
