import { exec, spawn } from 'node:child_process';
import util from 'node:util';
import semver from 'semver';
import prompts from 'prompts';
import path from 'node:path';
import {createRequire} from "module";
import * as os from "node:os";
const execAsync = util.promisify(exec);

const require = createRequire(import.meta.url)

async function getInstalledPackageVersion(packageName) {
    try {
        // Attempt to resolve the package relative to the current working directory.
        // const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
        const packageJson = await require("../package.json");
        return packageJson.version;
    } catch (error) {
        console.error(`Error getting installed version of ${packageName}:`, error);
        return null;
    }
}

async function getLatestPackageVersion(packageName) {
    try {
        const { stdout } = await execAsync(`npm view ${packageName} dist-tags --json`);
        const distTags = JSON.parse(stdout);
        return distTags;
    } catch (error) {
        console.error(`Error getting latest version of ${packageName}:`, error);
        return null;
    }
}

async function explainUpdatePackage(packageName, tag) {
    const isGlobal = process.cwd() === os.homedir();
    const command = isGlobal ? 'npm install -g' : 'npm install';
    const commandToRun = `${command} ${packageName}@${tag}`;

    const lines = [
        '',
        `✨ A new version of \x1b[1m${packageName}\x1b[0m\x1b[36m is available! ✨\x1b[0m`,
        '',
        `You can update to version \x1b[32m${tag}\x1b[0m by running:`,
        '',
        `\x1b[1m${commandToRun}\x1b[0m`,
        '',
        `Make sure you stop the program before updating!`,
        '',
        `\x1b[33mℹ️  This program will not start until it has been updated.\x1b[0m`,
        `\x1b[33m   You can bypass this check using the \x1b[1m--skip-update-check\x1b[0m\x1b[33m flag.\x1b[0m`,
        ''
    ];

    const contentWidth = Math.max(...lines.map(line => line.replace(/\x1b\[[0-9;]*m/g, '').length));
    const border = '─'.repeat(contentWidth + 2);
    const top = `╭${border}╮`;
    const bottom = `╰${border}╯`;

    const box = [
        top,
        ...lines.map(line => {
            const strippedLength = line.replace(/\x1b\[[0-9;]*m/g, '').length;
            const padding = ' '.repeat(contentWidth - strippedLength);
            return `│ ${line}${padding} │`;
        }),
        bottom
    ];

    console.log('\x1b[36m' + box.join('\n') + '\x1b[0m');
    process.exit(0);
}

export async function checkUpdates(packageName) {
    const currentVersion = await getInstalledPackageVersion(packageName);
    const distTags = await getLatestPackageVersion(packageName);
    const isAheadOfLatest = semver.lt(currentVersion, distTags['latest']);
    const currentTag = isAheadOfLatest ? 'latest' : 'next';

    console.log(`Current ${packageName} version: ${currentVersion} (${currentTag})`);
    console.log(`Latest ${packageName} version: ${distTags[currentTag]} (${currentTag})`);
    if (semver.lt(currentVersion, distTags[currentTag])) {
        await explainUpdatePackage(packageName, currentTag);
    } else {
        console.log(`${packageName} is up to date.`);
    }
}
