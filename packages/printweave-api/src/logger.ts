import winston from 'winston';

export enum LogType {
    PLUGIN = 'plugin',
    API = 'api',
}

export function createPluginLogger(pluginName: string, type?: LogType): winston.Logger {
    const colorize = (text: string, color: string) => {
        return `\u001b[${color}m${text}\u001b[0m`;
    }

    const colors = {
        [LogType.PLUGIN]: '36', // Cyan
        [LogType.API]: '32', // Green
    };

    const levelColors = {
        error: '31', // Red
        warn: '33', // Yellow
        info: '35', // Green
        debug: '34', // Blue
    }

    return winston.createLogger({
        level: 'info', // Set the default log level
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf(({timestamp, level, message}) => {
                return `${colorize(timestamp.toString(), '90')} ${colorize(`[${pluginName}]`, colors[type])} ${colorize(level.toUpperCase(), levelColors[level])}: ${message}`;
            })
        ),
        transports: [
            new winston.transports.Console() // Log to the console
        ]
    });
}
