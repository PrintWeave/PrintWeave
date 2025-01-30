#!/usr/bin/env node
import shell from 'shelljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import concurrently from 'concurrently';
const program = new Command();

program
  .version('0.1.0')
  .description('PrintWeave CLI');

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

program
  .command('start')
  .description('Start the frontend and API server')
  .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
  .action((options) => {
    const method = options.method || 'node';
    if (methodIsInstalled(method)) {
      const { result } = concurrently([
        { command: launchByMethod(method, __dirname + '/../printweave-api/dist/app.js'), name: 'api', prefixColor: 'magenta', cwd: __dirname + '/../printweave-api' },
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
    if (methodIsInstalled(method)) {
      shell.exec("cd printweave-api && " + launchByMethod(method, __dirname + '/../printweave-api/dist/app.js'));
    } else {
      console.log(`Method ${method} is not installed`);
    }
  });

program
  .command('migrate')
  .description('Run database migrations')
  .option('-r', ' --rollback', 'Rollback the last migration')
  .action((options) => {
    process.chdir(__dirname + '/../printweave-api');
    import('../printweave-api/dist/migrations.js').then(migrations => {
      if (options.rollback) {
        migrations.rollback();
      } else {
        migrations.migrate();
      }
    });
  });


// ...add more commands here...

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
      break;
    default:
      console.log(`Method ${method} is not supported`);
      return false;
  }
}