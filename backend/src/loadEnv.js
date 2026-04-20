import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const backendRoot = path.resolve(currentDirectory, '..');
const defaultEnvPath = path.join(backendRoot, '.env');

function normalizeEnvValue(rawValue) {
    const trimmedValue = rawValue.trim();

    if (
        (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
        (trimmedValue.startsWith('\'') && trimmedValue.endsWith('\''))
    ) {
        return trimmedValue.slice(1, -1);
    }

    return trimmedValue;
}

export function loadEnvFile(envPath = defaultEnvPath) {
    if (!fs.existsSync(envPath)) {
        return;
    }

    const envContents = fs.readFileSync(envPath, 'utf8');
    const envLines = envContents.split(/\r?\n/);

    for (const line of envLines) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        const normalizedLine = trimmedLine.startsWith('export ')
            ? trimmedLine.slice(7)
            : trimmedLine;
        const separatorIndex = normalizedLine.indexOf('=');

        if (separatorIndex === -1) {
            continue;
        }

        const key = normalizedLine.slice(0, separatorIndex).trim();
        const rawValue = normalizedLine.slice(separatorIndex + 1);

        if (!key || process.env[key] !== undefined) {
            continue;
        }

        process.env[key] = normalizeEnvValue(rawValue);
    }
}

loadEnvFile();
