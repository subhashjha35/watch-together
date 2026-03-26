import { type INestApplication, Logger, type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server as SocketIOServer, type ServerOptions } from 'socket.io';
import * as dotenv from 'dotenv';
import type { Express } from 'express';
import * as fs from 'node:fs';
import type * as https from 'node:https';
import * as path from 'node:path';
import { ServerConfigService } from '@watch-together/backend-config';
import { ServerFactory } from './server.factory';

const logger = new Logger('Bootstrap');

class HttpsSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly httpsServer: https.Server
  ) {
    super(app);
  }

  override createIOServer(_port: number, options?: ServerOptions) {
    return new SocketIOServer(this.httpsServer, options);
  }
}

export function loadEnvironmentVariables(): void {
  const envPath = path.join(process.cwd(), '.local.env');

  if (fs.existsSync(envPath)) {
    logger.log(`Loading environment from ${envPath}`);
    dotenv.config({ path: envPath });
    return;
  }

  logger.log('No .local.env file found, using .env or process.env');
  dotenv.config();
}

export function buildCorsOriginValidator(corsOrigin: string | string[]) {
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      logger.log('CORS: No origin header (mobile/curl request) - ALLOWED');
      callback(null, true);
      return;
    }

    logger.debug(`CORS: Received origin "${origin}", configured as "${corsOrigin}"`);

    if (corsOrigin === '*') {
      callback(null, true);
      return;
    }

    if (Array.isArray(corsOrigin)) {
      const allowed = corsOrigin.includes(origin);
      if (allowed) {
        callback(null, true);
        return;
      }

      logger.warn(`CORS: Origin "${origin}" not in allowed list: ${JSON.stringify(corsOrigin)}`);
      callback(new Error('CORS not allowed'));
      return;
    }

    if (origin === corsOrigin) {
      callback(null, true);
      return;
    }

    logger.warn(`CORS: Origin mismatch. Received: "${origin}", Expected: "${corsOrigin}"`);
    const receivedBase = origin.replace(/^https?:\/\//, '');
    const configBase = String(corsOrigin).replace(/^https?:\/\//, '');

    if (receivedBase === configBase) {
      logger.log('CORS: Protocol mismatch but host matches - ALLOWING for development');
      callback(null, true);
      return;
    }

    callback(new Error('CORS not allowed'));
  };
}

export async function bootstrapBackendApplication(rootModule: Type<unknown>): Promise<void> {
  loadEnvironmentVariables();

  const app = await NestFactory.create<INestApplication>(rootModule);
  const configService = app.get(ServerConfigService);
  const config = configService.getServerConfig();

  app.enableCors({
    origin: buildCorsOriginValidator(config.corsOrigin),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  if (config.useHttps) {
    const serverFactory = app.get(ServerFactory);
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    const httpsServer = serverFactory.createServer(expressApp, config) as https.Server;

    app.useWebSocketAdapter(new HttpsSocketIoAdapter(app, httpsServer));
    await app.init();

    await new Promise<void>((resolve) => {
      httpsServer.listen(config.port, config.ip, () => {
        resolve();
      });
    });

    logger.log(`✓ Server is running on https://${config.ip}:${config.port}`);
    logger.log(`✓ CORS Origin: ${config.corsOrigin}`);
    logger.log(`✓ WebSocket Server (WSS): Ready on wss://${config.ip}:${config.port}/socket.io/`);
    return;
  }

  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(config.port, config.ip);

  logger.log(`✓ Server is running on http://${config.ip}:${config.port}`);
  logger.log(`✓ CORS Origin: ${config.corsOrigin}`);
  logger.log('✓ WebSocket Server: Ready');
}
