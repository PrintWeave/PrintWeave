#!/usr/bin/env node
import shell, {env} from 'shelljs';
import path from 'path';
import {fileURLToPath} from 'url';
import {Command} from 'commander';
import concurrently from 'concurrently';
import {createRequire} from 'module';
import url from 'url';
import {checkUpdates} from "./update.mjs"

const require = createRequire(import.meta.url);
const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {getPathPackage} from './paths.js';
import inquirer from 'inquirer';
import {User} from "@printweave/models";
import dotenv from 'dotenv';
import * as fs from "node:fs";
import * as os from "node:os";
import * as crypto from "node:crypto";

program
    .version(require('../package.json').version)
    .description('PrintWeave CLI');

program
    .command('start')
    .description('Start the frontend and API server')
    .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
    .option('--skip-update-check', 'Force update without prompt')
    .action(async (options) => {
        if (options.skipUpdateCheck) {
            console.log('\x1b[33m%s\x1b[0m', `
╭──────────────────────────────────────────────────────────────────────────────────╮
│                                                                                  │
│   ⚠️  \x1b[1m\x1b[33mWARNING:\x1b[0m\x1b[33m This flag will skip the update check. Please ensure the program   │
│   is up-to-date to avoid potential issues.                                       │
│                                                                                  │
╰──────────────────────────────────────────────────────────────────────────────────╯
`);
        } else {
            await checkUpdates("@printweave/cli")
        }

        const method = options.method || 'node';
        if (methodIsInstalled(method)) {
            const apiPath = getPathPackage('@printweave/api');
            const apiDir = path.resolve(path.dirname(apiPath), '..');
            const webPath = getPathPackage('@printweave/web');
            const webDir = path.resolve(path.dirname(webPath), '..');

            const {result} = concurrently([
                {
                    command: "cd " + apiDir + " && " + launchByMethod(method, apiPath),
                    name: 'api',
                    prefixColor: 'magenta'
                },
                {
                    command: "cd " + webDir + " && " + launchByMethod(method, webPath),
                    name: 'web',
                    prefixColor: 'blue'
                }
            ]);

            result.then(() => {
                console.log('Exited with code 0');
            }, () => {
                console.log('Exited with code 1');
            });
        } else {
            console.log(`Method ${method} is not installed`);
        }
    });

program
    .command('api')
    .description('Start the API server')
    .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
    .action((options) => {
        const method = options.method || 'node';
        const apiPath = getPathPackage('@printweave/api');
        const apiDir = path.resolve(path.dirname(apiPath), '..');

        if (methodIsInstalled(method)) {
            shell.cd(apiDir);
            shell.exec(launchByMethod(method, apiPath));
        } else {
            console.log(`Method ${method} is not installed`);
        }
    });

program
    .command('web')
    .description('Start the web frontend')
    .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
    .action((options) => {
        const method = options.method || 'node';
        const webPath = getPathPackage('@printweave/web');
        const webDir = path.resolve(path.dirname(webPath), '..');

        if (methodIsInstalled(method)) {
            shell.cd(webDir);
            shell.exec(launchByMethod(method, webDir));
        } else {
            console.log(`Method ${method} is not installed`);
        }
    });

program
    .command('migrate')
    .option('-r, --rollback', 'Rollback the last migration', false)
    .description('Run database migrations')
    .action(async (options, sCommand) => {
        const apiPath = getPathPackage('@printweave/api');
        const apiDir = path.resolve(path.dirname(apiPath), '..');

        process.chdir(apiDir);
        const api = await import("file://" + apiDir + '/dist/main.js');
        const {migrations} = await api.getMigrationsForMigrate();

        if (options.rollback) {
            migrations.rollback();
        } else {
            migrations.migrate();
        }
    });

program
    .command('configure')
    .description('Configure the PrintWeave API')
    .action(async () => {
        console.log('Let\'s configure the API');

        const apiPath = getPathPackage('@printweave/api');
        const apiDir = path.resolve(path.dirname(apiPath), '..');

        process.chdir(apiDir);

        const envPath = path.resolve(apiDir, '.env');

        if (!fs.existsSync(envPath)) {
            fs.writeFileSync(envPath, '');
        }

        const envContent = fs.readFileSync(envPath, 'utf8');

        const env = dotenv.parse(envContent);

        const hasSecretKey = env.SECRET_KEY !== undefined;

        const {generateKey} = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'generateKey',
                message: 'Do you want to generate a new secret key?' + (hasSecretKey ? ' (This will overwrite the existing key)' : ' (There is no secret key set)'),
                default: !hasSecretKey
            }]);

        if (generateKey) {
            const secretKey = crypto.randomBytes(64).toString('hex');
            console.log('Setting the secret key');
            setEnvValue('SECRET_KEY', secretKey, envPath);
        }

        const migrations = await import("file://" + apiDir + '/dist/migrations.js');
        console.log('Checking for pending migrations');
        if ((await migrations.umzug.pending()).length > 0) {
            console.log('There are pending migrations, do you want to run them?');

            const {runMigrations} = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'runMigrations',
                    message: 'Are you sure you want to run the migrations?',
                    default: true
                }
            ]);

            if (runMigrations) {
                await migrations.migrate();
            } else {
                console.log('Please run the migrations before configuring the API');
                return;
            }
        } else {
            console.log('There are no pending migrations');
        }

        const {port} = await inquirer.prompt([
            {
                type: 'input',
                name: 'port',
                message: 'Enter the API port',
                default: env.PORT || 3000
            }
        ]);

        console.log('Setting the API port');
        setEnvValue('PORT', port, envPath);

        const {websocketPort} = await inquirer.prompt([
            {
                type: 'input',
                name: 'websocketPort',
                message: 'Enter the API websocket port',
                default: env.WEBSOCKET_PORT || 3001
            }]);

        console.log('Setting the API websocket port');
        setEnvValue('WEBSOCKET_PORT', websocketPort, envPath);

        const {username, password, email} = await inquirer.prompt([
            {
                type: 'input',
                name: 'username',
                message: 'Enter the admin username'
            },
            {
                type: 'password',
                name: 'password',
                message: 'Enter the admin password'
            },
            {
                type: 'input',
                name: 'email',
                message: 'Enter the admin email'
            }
        ]);

        console.log('Creating the admin user');
        const user = User.build({
            username,
            password,
            email
        });

        try {
            await user.save();
        } catch (error) {
            console.error('Error creating the admin user', error.message);
            return;
        }

        console.log('Admin user created');

        console.log('Configuration completed');

        console.log('You can start the API server by running `printweave api`');
        console.log('You can start the frontend and API by running `printweave start`');
    });

program.parse(process.argv);

function methodIsInstalled(method) {
    return shell.which(method);
}

function launchByMethod(method, file) {
    switch (method) {
        case 'node':
            return `node ${file}`;
        case 'forever':
            return `forever start ${file}`;
        default:
            console.log(`Method ${method} is not supported`);
            return false;
    }
}

function setEnvValue(key, value, path) {

    // read file from hdd & split if from a linebreak to a array
    const ENV_VARS = fs.readFileSync(path, "utf8").split(os.EOL);

    // find the env we want based on the key
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        return line.match(new RegExp(key));
    }));

    if (target === -1) {
        // if the key does not exist, add it to the end of the file
        ENV_VARS.push(`${key}=${value}`);
    } else {
        // replace the key/value with the new value
        ENV_VARS.splice(target, 1, `${key}=${value}`);
    }

    // write everything back to the file system
    fs.writeFileSync(path, ENV_VARS.join(os.EOL));
}
