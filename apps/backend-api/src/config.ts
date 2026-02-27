import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

export interface ServerConfig {
  port: number;
  ip: string;
  useHttps: boolean;
  corsOrigin: string;
  baseDir: string;
}

export function loadConfig(): ServerConfig {
  dotenv.config({ path: path.join(process.cwd(), '.local.env') });

  const baseDir = path.dirname(fileURLToPath(import.meta.url));

  return {
    port: Number(process.env.PORT ?? process.env.BACKEND_PORT) || 3000,
    ip: process.env.IP || '0.0.0.0',
    useHttps: process.env.USE_HTTPS === 'true',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    baseDir
  };
}
