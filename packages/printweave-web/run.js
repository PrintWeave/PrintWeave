import {preview} from 'vite';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {createLogger, format, transports} from "winston";

const colorize = (text, color) => {
    return `\u001b[${color}m${text}\u001b[0m`;
}


const levelColors = {
    error: '31', // Red
    warn: '33', // Yellow
    info: '35', // Green
    debug: '34', // Blue
}

export const logger = createLogger({
    level: 'info', // Set the default log level
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(({timestamp, level, message}) => {
            return `${colorize(timestamp.toString(), '90')} ${colorize(`[WEB]`, 37)} ${colorize(level.toUpperCase(), levelColors[level])}: ${message}`
                .replaceAll('\n', `\n${' '.repeat(32)}`) // Indent new lines for better readability
        }),
    ),
    transports: [
        new transports.Console() // Log to the console
    ]
});

// Handle .env files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadEnvFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const envContent = fs.readFileSync(filePath, 'utf-8');
            const envVars = envContent.split('\n');

            envVars.forEach(line => {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                if (match && !match[0].startsWith('#')) {
                    const key = match[1];
                    let value = match[2] || '';

                    // Remove quotes if present
                    value = value.replace(/^(['"])(.*)\1$/, '$2');
                    process.env[key] = value;
                }
            });
            logger.info(`Loaded environment variables from ${path.basename(filePath)}`);
        }
    } catch (error) {
        logger.info(`No ${path.basename(filePath)} file found or error loading it.`);
    }
};

// Load environment variables in the right order
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, `.env.${process.env.NODE_ENV || 'production'}`));
loadEnvFile(path.join(__dirname, '.env.local'));

// Get configuration from environment variables with fallbacks
const PORT = process.env.VITE_PORT || process.env.PORT || 4000;
const HOST = process.env.VITE_HOST || process.env.HOST || '0.0.0.0'; // Default to all interfaces for production
const OPEN = (process.env.VITE_OPEN || process.env.OPEN || 'false').toLowerCase() === 'true';
const BASE_URL = process.env.VITE_BASE_URL || process.env.BASE_URL || '/';

async function startProductionServer() {
    logger.info(`Starting Vite production preview server with configuration:
- PORT: ${PORT}
- HOST: ${HOST}
- OPEN: ${OPEN}
- BASE_URL: ${BASE_URL}`);

    try {
        const server = await preview({
            root: __dirname,
            base: BASE_URL,
            preview: {
                port: Number(PORT),
                host: HOST,
                open: OPEN,
                strictPort: true
            },
        });

        server.resolvedUrls?.local?.forEach(url => {
            logger.info(`Local: ${url}`);
        });
        server.resolvedUrls?.network?.forEach(url => {
            logger.info(`Network: ${url}`);
        });
        logger.info(`Vite production server running on http://${HOST === true ? 'localhost' : HOST}:${PORT}`);
    } catch (error) {
        logger.error('Failed to start production server:', error);
        process.exit(1);
    }
}

// Check if the dist directory exists before starting the server
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    logger.error('Error: dist directory not found. Please run "npm run build" first.');
    process.exit(1);
}

startProductionServer();
