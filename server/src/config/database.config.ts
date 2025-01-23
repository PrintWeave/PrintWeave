import {Sequelize} from "sequelize";

const db = new Sequelize({
    dialect: "sqlite",
    storage: "../db.sqlite",
    logging: true,
});

export default db;
