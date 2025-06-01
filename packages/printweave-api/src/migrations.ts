import {Sequelize} from 'sequelize';
import {Umzug, SequelizeStorage, RunnableMigration} from 'umzug';
import db from './config/database.config.js';
import path from 'path';
import {PluginManager} from "./plugins/plugin.manager.js";

export class Migrations {

    private db: Sequelize;
    private umzug: Umzug;
    private pluginManager: PluginManager;

    constructor(db: Sequelize, pluginManager: PluginManager, plugins: RunnableMigration<Sequelize>[] = []) {
        this.db = db;
        this.pluginManager = pluginManager;

        db.authenticate()

        this.umzug = new Umzug({
            migrations: [ ...plugins,  ...this.pluginManager.getPlugins().flatMap(plugin => plugin.migrations) ],
            context: db,
            storage: new SequelizeStorage({sequelize: db}),
            logger: console,
        });
    }

// Run migrations
    async migrate() {
        try {
            await this.umzug.up();
            console.log('Migrations ran successfully');
        } catch (err) {
            console.error('Error running migrations', err);
        } finally {
            await this.db.close();
        }
    }

    async rollback() {
        try {
            await this.umzug.down();
            console.log('Migrations rolled back successfully');
        } catch (err) {
            console.error('Error rolling back migrations', err);
        } finally {
            await this.db.close();
        }
    }

    async pending() {
        return await this.umzug.pending();
    }

    getUmzug() {
        return this.umzug;
    }
}
