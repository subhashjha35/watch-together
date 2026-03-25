import * as https from 'node:https';
import * as http from 'node:http';
import * as fs from 'node:fs';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import type { ServerConfig } from '../../config/interfaces/server-config.interface';

/**
 * Factory service for creating HTTP/HTTPS servers
 * Handles SSL certificate loading and server instantiation
 */
@Injectable()
export class ServerFactory {
  private readonly logger = new Logger(ServerFactory.name);

  /**
   * Create an HTTP or HTTPS server based on configuration
   * @param expressApp The Express.js app instance (from NestJS getHttpAdapter)
   * @param config Server configuration
   */
  createServer(
    expressApp: any,
    config: ServerConfig
  ): http.Server | https.Server {
    if (config.useHttps) {
      return this.createHttpsServer(expressApp, config);
    }
    return http.createServer(expressApp);
  }

  /**
   * Create HTTPS server with certificates
   * @throws Error if certificate files are not found or cannot be read
   */
  private createHttpsServer(expressApp: any, config: ServerConfig): https.Server {
    const keyPath = path.join(config.baseDir, 'apps/backend-api/certs/key.pem');
    const certPath = path.join(config.baseDir, 'apps/backend-api/certs/cert.pem');

    try {
      const key = fs.readFileSync(keyPath, 'utf8');
      const cert = fs.readFileSync(certPath, 'utf8');

      this.logger.log('HTTPS server configured with SSL certificates');

      return https.createServer({ key, cert }, expressApp);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to read SSL certificates: ${message}\n` +
        `Expected paths:\n` +
        `  Key: ${keyPath}\n` +
        `  Cert: ${certPath}`
      );
      throw error;
    }
  }
}
