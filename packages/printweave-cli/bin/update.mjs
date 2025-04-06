import { exec } from 'node:child_process';
import util from 'node:util';
import semver from 'semver';
import prompts from 'prompts';
import path from 'node:path';
import {createRequire} from "module";
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

async function promptForUpdate(packageName) {
    const response = await prompts({
        type: 'confirm',
        name: 'shouldUpdate',
        message: `An older version of ${packageName} is installed. Update to the latest version? Use flag --force to skip this prompt.`,
        initial: true,
    });
    return response.shouldUpdate;
}

async function updatePackage(packageName, tag) {
    try {
        console.log(`Updating ${packageName} to the latest version with tag ${tag}...`);
        const { stdout, stderr } = await execAsync(`npm install ${packageName}@${tag}`);
        console.log(stdout);
        console.log(stdout);
        if (stderr) {
            console.error(stderr);
        }
        console.log(`${packageName} updated successfully!`);
    } catch (error) {
        console.error(`Error updating ${packageName}:`, error);
    }
}

export async function checkUpdates(packageName) {
    const currentVersion = await getInstalledPackageVersion(packageName);
    const distTags = await getLatestPackageVersion(packageName);
    const isAheadOfLatest = semver.lt(currentVersion, distTags['latest']);
    const currentTag = isAheadOfLatest ? 'latest' : 'next';

    console.log(`Current ${packageName} version: ${currentVersion} (${currentTag})`);
    console.log(`Latest ${packageName} version: ${distTags[currentTag]} (${currentTag})`);
    if (semver.lt(currentVersion, distTags[currentTag])) {
        const shouldUpdate = await promptForUpdate(packageName);
        if (shouldUpdate) {
            await updatePackage(packageName, currentTag);
        } else {
            console.log('Update cancelled.');
        }
    } else {
        console.log(`${packageName} is up to date.`);
    }
}
