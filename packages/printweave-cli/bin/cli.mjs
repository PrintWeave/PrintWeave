#!/usr/bin/env node
import shell from 'shelljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import concurrently from 'concurrently';
import { createRequire } from 'module';
import url from 'url';
const require = createRequire(import.meta.url);
const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .version(require('../package.json').version)
  .description('PrintWeave CLI');

program
  .command('start')
  .description('Start the frontend and API server')
  .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
  .action(async (options) => {
    const method = options.method || 'node';
    if (methodIsInstalled(method)) {
      const apiPath = import.meta.resolve('@printweave/api').replace('file://', '');
      const apiDir = path.resolve(path.dirname(apiPath), '..');
  
      const { result } = concurrently([
        { command: launchByMethod(method, apiPath), name: 'api', prefixColor: 'magenta', cwd: apiDir },
        { command: 'echo "Frontend server is not implemented yet"', name: 'frontend', prefixColor: 'blue' }
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
    const apiPath = import.meta.resolve('@printweave/api').replace('file://', '');
    const apiDir = path.resolve(path.dirname(apiPath), '..');

    if (methodIsInstalled(method)) {
      shell.cd(apiDir);
      shell.exec(launchByMethod(method, apiPath));
    } else {
      console.log(`Method ${method} is not installed`);
    }
  });

program
  .command('migrate')
  .description('Run database migrations')
  .option('-r', ' --rollback', 'Rollback the last migration')
  .action(async (options) => {
    const apiPath = import.meta.resolve('@printweave/api').replace('file://', '');
    const apiDir = path.resolve(path.dirname(apiPath), '..');

    process.chdir(apiDir);
    const migrations = await import(apiDir + '/dist/migrations.js');
    if (options.rollback) {
      migrations.rollback();
    } else {
      migrations.migrate();
    }
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
