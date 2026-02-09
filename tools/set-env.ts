import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .local.env file
const envPath = path.resolve(__dirname, '../.local.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const ip = envConfig['IP'] || '127.0.0.1';
const backendPort = envConfig['BACKEND_PORT'] || '3000';

const environmentFilePath = path.resolve(
  __dirname,
  '../apps/watch-together/src/environments/environment.ts'
);

const environmentContent = `export const environment = {
  production: false,
  apiUrl: 'https://${ip}:${backendPort}', // Local backend for development
};
`;

fs.writeFileSync(environmentFilePath, environmentContent);
console.log(`Environment file updated with IP: ${ip} and Port: ${backendPort}`);
