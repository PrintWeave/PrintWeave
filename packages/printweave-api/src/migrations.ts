import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import db from './config/database.config.js';
import path from 'path';

db.authenticate()

const umzug = new Umzug({
    migrations: { glob: 'migrations/*.js' },
    context: db.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: db }),
    logger: console,
});

export { umzug };

// Run migrations
export async function migrate() {
    try {
        await umzug.up();
        console.log('Migrations ran successfully');
    }
    catch (err) {
        console.error('Error running migrations', err);
    }
    finally {
        await db.close();
    }
}

export async function rollback() {
    try {
        await umzug.down();
        console.log('Migrations rolled back successfully');
    }
    catch (err) {
        console.error('Error rolling back migrations', err);
    }
    finally {
        await db.close();
    }
}

if (process.argv.includes('rollback')) {
    rollback();
}

if (process.argv.includes('migrate')) {
    migrate();
}