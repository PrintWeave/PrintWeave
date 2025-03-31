export function envString(name: string, defaultValue?: string): string {
    const value = process.env[name];
    if (!value) {
        if (defaultValue !== undefined && defaultValue !== null) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
}

export function envInt(name: string, defaultValue?: number): number {
    const value = process.env[name];
    if (!value) {
        if (defaultValue) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${name} is not set`);
    }
    return parseInt(value, 10);
}

export function envBool(name: string, defaultValue?: boolean): boolean {
    const value = process.env[name];
    if (!value) {
        if (defaultValue) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value === 'true' || value === '1';
}
