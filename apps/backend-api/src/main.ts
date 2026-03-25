import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import path from 'node:path';
import { AppModule } from './app.module';
import { ServerConfigService } from './config/config.service';
import { ServerFactory } from './common/factories/server.factory';

const logger = new Logger('Bootstrap');

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

  // Configure CORS for Express REST endpoints and Socket.IO
  // Build the origin validator function
  const buildOriginValidator = () => {
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        logger.log('CORS: No origin header (mobile/curl request) - ALLOWED');
        callback(null, true);
        return;
      }

      logger.debug(`CORS: Received origin "${origin}", configured as "${config.corsOrigin}"`);

      if (config.corsOrigin === '*') {
        // Allow all origins
        logger.debug('CORS: Wildcard origin configured - ALLOWED');
        callback(null, true);
      } else if (Array.isArray(config.corsOrigin)) {
        // Check if origin is in allowed list
        const allowed = (config.corsOrigin as string[]).includes(origin);
        if (allowed) {
          logger.debug(`CORS: Origin found in allowed list - ALLOWED`);
          callback(null, true);
        } else {
          logger.warn(`CORS: Origin "${origin}" not in allowed list: ${JSON.stringify(config.corsOrigin)}`);
          callback(new Error('CORS not allowed'));
        }
      } else {
        // Single origin string
        const allowed = origin === config.corsOrigin;
        if (allowed) {
          logger.debug('CORS: Origin matches configured origin - ALLOWED');
          callback(null, true);
        } else {
          logger.warn(`CORS: Origin mismatch. Received: "${origin}", Expected: "${config.corsOrigin}"`);
          // For development, allow if just the protocol differs (http vs https)
          const receivedBase = origin.replace(/^https?:\/\//, '');
          const configBase = String(config.corsOrigin).replace(/^https?:\/\//, '');
          if (receivedBase === configBase) {
            logger.log('CORS: Protocol mismatch but host matches - ALLOWING for development');
            callback(null, true);
            return;
          }
          callback(new Error('CORS not allowed'));
        }
      }
    };
  };

  // Enable CORS using NestJS built-in method
  app.enableCors({
    origin: buildOriginValidator(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Configure Socket.IO adapter with CORS settings
  // Socket.IO with credentials: true requires a validation function
  let corsOriginValidator: ((origin: string | undefined) => boolean) | string;
  
  if (config.corsOrigin === '*') {
    // Allow all origins when '*' is configured
    corsOriginValidator = (origin: string | undefined) => true;
  } else if (Array.isArray(config.corsOrigin)) {
    // Validate against list of allowed origins
    corsOriginValidator = (origin: string | undefined) => {
      if (!origin) return false;
      return (config.corsOrigin as string[]).includes(origin);
    };
  } else {
    // Single origin - use a validator function
    const allowedOrigin = config.corsOrigin;
    corsOriginValidator = (origin: string | undefined) => {
      if (!origin) return false;
      return origin === allowedOrigin;
    };
  }

  // Handle HTTPS vs HTTP server initialization
  if (config.useHttps) {
    // For HTTPS: Create the server first, then attach Socket.IO to it
    const serverFactory = app.get(ServerFactory);
    const expressApp = app.getHttpAdapter().getInstance();
    const httpsServer = serverFactory.createServer(expressApp, config);

    // Import Socket.IO to attach it to the HTTPS server
    const { Server: SocketIOServer } = await import('socket.io');
    
    // Attach Socket.IO to the HTTPS server with proper CORS settings
    new SocketIOServer(httpsServer, {
      cors: {
        origin: corsOriginValidator as any,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Initialize the app
    await app.init();

    // Listen on the configured port and IP
    await new Promise<void>((resolve) => {
      httpsServer.listen(config.port, config.ip, () => {
        resolve();
      });
    });
  } else {
    // Use standard NestJS listen for HTTP (handles Socket.IO properly via adapter)
    app.useWebSocketAdapter(
      new IoAdapter({
        cors: {
          origin: corsOriginValidator as any,
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          credentials: true,
          allowedHeaders: ['Content-Type', 'Authorization']
        }
      })
    );
    await app.listen(config.port, config.ip);
  }

  const protocol = config.useHttps ? 'https' : 'http';
  logger.log(
    `✓ Server is running on ${protocol}://${config.ip}:${config.port}`
  );
  logger.log(`✓ CORS Origin: ${config.corsOrigin}`);
  logger.log(`✓ WebSocket Server: Ready`);
}

bootstrap().catch((error) => {
  logger.error(`✗ Failed to start server:`, error);
  process.exit(1);
});
