import * as fs from "fs/promises";

import path from "path";
import { User, Printer, UserPrinter, ModelCtor} from "@printweave/models";
import {Sequelize} from "sequelize-typescript";

export default function createDb(models: ModelCtor[]): Sequelize {
    const db = new Sequelize({
        dialect: "sqlite",
        storage: path.resolve(process.cwd(), "printweave.sqlite"),
        logging: true,
        models: [User, Printer, UserPrinter, ...models],
    });

    return db;
}
