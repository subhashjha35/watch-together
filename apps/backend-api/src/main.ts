import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { type INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server as SocketIOServer, type ServerOptions } from 'socket.io';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import type * as https from 'node:https';
import path from 'node:path';
import { AppModule } from './app.module';
import { ServerConfigService } from './config/config.service';
import { ServerFactory } from './common/factories/server.factory';

const logger = new Logger('Bootstrap');

/**
 * Custom IoAdapter that binds Socket.IO to an existing HTTPS server
 * so that the NestJS gateway handlers are registered on the same
 * Socket.IO instance that clients connect to.
 */
class HttpsSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly httpsServer: https.Server
  ) {
    super(app);
  }

  override createIOServer(_port: number, options?: ServerOptions) {
    // Create Socket.IO server attached to the HTTPS server directly,
    // bypassing the parent's createIOServer which would use the default HTTP server
    return new SocketIOServer(this.httpsServer, options);
  }
}

/**
 * Load environment variables from .local.env before anything else
 * This must happen before NestFactory creates the app
 */
function loadEnvironmentVariables(): void {
  const envPath = path.join(process.cwd(), '.local.env');

  // Check if .local.env exists and load it
  if (fs.existsSync(envPath)) {
    logger.log(`Loading environment from ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    logger.log('No .local.env file found, using .env or process.env');
    dotenv.config();
  }
}

/**
 * Build a CORS origin validator function from the config
 */
function buildCorsOriginValidator(corsOrigin: string | string[]) {
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.log('CORS: No origin header (mobile/curl request) - ALLOWED');
      callback(null, true);
      return;
    }

    logger.debug(`CORS: Received origin "${origin}", configured as "${corsOrigin}"`);

    if (corsOrigin === '*') {
      logger.debug('CORS: Wildcard origin configured - ALLOWED');
      callback(null, true);
    } else if (Array.isArray(corsOrigin)) {
      const allowed = corsOrigin.includes(origin);
      if (allowed) {
        logger.debug('CORS: Origin found in allowed list - ALLOWED');
        callback(null, true);
      } else {
        logger.warn(`CORS: Origin "${origin}" not in allowed list: ${JSON.stringify(corsOrigin)}`);
        callback(new Error('CORS not allowed'));
      }
    } else {
      const allowed = origin === corsOrigin;
      if (allowed) {
        logger.debug('CORS: Origin matches configured origin - ALLOWED');
        callback(null, true);
      } else {
        logger.warn(`CORS: Origin mismatch. Received: "${origin}", Expected: "${corsOrigin}"`);
        // For development, allow if just the protocol differs (http vs https)
        const receivedBase = origin.replace(/^https?:\/\//, '');
        const configBase = String(corsOrigin).replace(/^https?:\/\//, '');
        if (receivedBase === configBase) {
          logger.log('CORS: Protocol mismatch but host matches - ALLOWING for development');
          callback(null, true);
          return;
        }
        callback(new Error('CORS not allowed'));
      }
    }
  };
}

/**
 * Bootstrap the NestJS application
 * Sets up HTTP/HTTPS server, Socket.IO, and starts listening
 */
async function bootstrap(): Promise<void> {
  // Load environment variables FIRST
  loadEnvironmentVariables();

  // Create NestJS app (always HTTP initially)
  const app = await NestFactory.create<INestApplication>(AppModule);

  const configService = app.get(ServerConfigService);
  const config = configService.getServerConfig();

  // Enable CORS using NestJS built-in method
  app.enableCors({
    origin: buildCorsOriginValidator(config.corsOrigin),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Handle HTTPS vs HTTP server initialization
  if (config.useHttps) {
    // For HTTPS: Create a custom HTTPS server and bind Socket.IO to it
    // via a custom adapter so NestJS gateway handlers are registered
    // on the same Socket.IO instance that serves over WSS.
    const serverFactory = app.get(ServerFactory);
    const expressApp = app.getHttpAdapter().getInstance();
    const httpsServer = serverFactory.createServer(expressApp, config) as https.Server;

    // Use a custom adapter that attaches Socket.IO to the HTTPS server
    app.useWebSocketAdapter(new HttpsSocketIoAdapter(app, httpsServer));

    // Initialize the app (registers gateway handlers on our adapter)
    await app.init();

    // Start the HTTPS server listening
    await new Promise<void>((resolve) => {
      httpsServer.listen(config.port, config.ip, () => {
        resolve();
      });
    });

    const protocol = 'https';
    logger.log(`✓ Server is running on ${protocol}://${config.ip}:${config.port}`);
    logger.log(`✓ CORS Origin: ${config.corsOrigin}`);
    logger.log(`✓ WebSocket Server (WSS): Ready on wss://${config.ip}:${config.port}/socket.io/`);
  } else {
    // Use standard NestJS listen for HTTP (handles Socket.IO properly via adapter)
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(config.port, config.ip);

    logger.log(`✓ Server is running on http://${config.ip}:${config.port}`);
    logger.log(`✓ CORS Origin: ${config.corsOrigin}`);
    logger.log(`✓ WebSocket Server: Ready`);
  }
}

bootstrap().catch((error) => {
  logger.error(`✗ Failed to start server:`, error);
  process.exit(1);
});
