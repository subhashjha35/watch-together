import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface ServerConfig {
  port: number;
  ip: string;
  useHttps: boolean;
  corsOrigin: string;
  baseDir: string;
  iceServers: IceServer[];
  meteredApiKey: string | undefined;
  meteredAppName: string | undefined;
}

const DEFAULT_ICE_SERVERS: IceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302'
    ]
  },
  {
    urls: 'stun:stun.relay.metered.ca:80'
  }
];

function parseIceServers(): IceServer[] {
  const raw = process.env.ICE_SERVERS;
  if (!raw) return DEFAULT_ICE_SERVERS;
  try {
    const parsed = JSON.parse(raw) as IceServer[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ICE_SERVERS;
    return [...DEFAULT_ICE_SERVERS, ...parsed];
  } catch {
    console.warn('Failed to parse ICE_SERVERS env var, using defaults');
    return DEFAULT_ICE_SERVERS;
  }
}

export function loadConfig(): ServerConfig {
  dotenv.config({ path: path.join(process.cwd(), '.local.env') });

  const baseDir = path.dirname(fileURLToPath(import.meta.url));

  return {
    port: Number(process.env.PORT ?? process.env.BACKEND_PORT) || 3000,
    ip: process.env.IP || '0.0.0.0',
    useHttps: process.env.USE_HTTPS === 'true',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    baseDir,
    iceServers: parseIceServers(),
    meteredApiKey: process.env.METERED_API_KEY,
    meteredAppName: process.env.METERED_APP_NAME
  };
}
