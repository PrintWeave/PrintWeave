import {Sequelize} from 'sequelize';
import {Umzug, SequelizeStorage} from 'umzug';
import db from './config/database.config.js';
import path from 'path';

export class Migrations {

    private db: Sequelize;
    private umzug: Umzug;

    constructor(db: Sequelize) {
        this.db = db;

        db.authenticate()

        this.umzug = new Umzug({
            migrations: {glob: 'migrations/*.js'},
            context: db.getQueryInterface(),
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
