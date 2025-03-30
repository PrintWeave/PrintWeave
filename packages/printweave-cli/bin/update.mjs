import { exec } from 'node:child_process';
import util from 'node:util';
import semver from 'semver';
import prompts from 'prompts';
import path from 'node:path';
const execAsync = util.promisify(exec);

async function getInstalledPackageVersion(packageName) {
    try {
        // Attempt to resolve the package relative to the current working directory.
        const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
        const packageJson = await import(`file://${packagePath}`);  // Use file:// for local imports
        return packageJson.default.version;
    } catch (error) {
        console.error(`Error getting installed version of ${packageName}:`, error);
        return null;
    }
}

async function getLatestPackageVersion(packageName) {
    try {
        const { stdout } = await execAsync(`npm view ${packageName} version`);
        return stdout.trim();
    } catch (error) {
        console.error(`Error getting latest version of ${packageName}:`, error);
        return null;
    }
}

async function shouldUpdatePackage(currentVersion, latestVersion) {
    if (!currentVersion || !latestVersion) {
        return false;
    }
    return semver.lt(currentVersion, latestVersion);
}

async function promptForUpdate(packageName) {
    const response = await prompts({
        type: 'confirm',
        name: 'shouldUpdate',
        message: `An older version of ${packageName} is installed. Update to the latest version?`,
        initial: true,
    });
    return response.shouldUpdate;
}

async function updatePackage(packageName) {
    try {
        console.log(`Updating ${packageName} to the latest version...`);
        const { stdout, stderr } = await execAsync(`npm install ${packageName}@latest`);
        console.log(stdout);
        if (stderr) {
            console.error(stderr);
        }
        console.log(`${packageName} updated successfully!`);
    } catch (error) {
        console.error(`Error updating ${packageName}:`, error);
    }
}

async function checkUpdates(packageName) {
    const currentVersion = await getInstalledPackageVersion(packageName);
    const latestVersion = await getLatestPackageVersion(packageName);

    console.log(`Current ${packageName} version: ${currentVersion}`);
    console.log(`Latest ${packageName} version: ${latestVersion}`);

    if (await shouldUpdatePackage(currentVersion, latestVersion)) {
        const shouldUpdate = await promptForUpdate(packageName);
        if (shouldUpdate) {
            await updatePackage(packageName);
        } else {
            console.log('Update cancelled.');
        }
    } else {
        console.log(`${packageName} is up to date.`);
    }
}
