#!/usr/bin/env node
var shell   = require('shelljs');
const { Command } = require('commander');

const program = new Command();

program
  .version('0.1.0')
  .description('PrintWeave CLI');

program
  .command('start')
  .description('Start the frontend and API server')
  .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
  .action((options) => {
    method = options.method || 'node';
    if (methodIsInstalled(method)) {
      shell.exec(`concurrently -n api,frontend -c magenta,blue "${launchByMethod(method, __dirname + '/../server/dist/app.js')}" "echo 'Frontend server is not implemented yet'"`);
    } else {
      console.log(`Method ${method} is not installed`);
    }
  });

program
  .command('api')
  .description('Start the API server')
  .option('-m, --method <method>', 'Method to start the server, default is node, available methods: node, forever', 'node')
  .action((options) => {
    method = options.method || 'node';
    if (methodIsInstalled(method)) {
      shell.exec(launchByMethod(method, __dirname + '/../server/dist/app.js'));
    } else {
      console.log(`Method ${method} is not installed`);
    }
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