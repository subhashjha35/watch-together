import { Injectable, Logger } from '@nestjs/common';
import type { Express } from 'express';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';
import type { ServerConfig } from '@watch-together/backend-config';

@Injectable()
export class ServerFactory {
  private readonly logger = new Logger(ServerFactory.name);

  createServer(expressApp: Express, config: ServerConfig): http.Server | https.Server {
    if (config.useHttps) {
      return this.createHttpsServer(expressApp, config);
    }

    return http.createServer(expressApp);
  }

  private createHttpsServer(expressApp: Express, config: ServerConfig): https.Server {
    const baseDir = String(config.baseDir);
    const keyPath = path.join(baseDir, 'apps/backend-api/certs/key.pem');
    const certPath = path.join(baseDir, 'apps/backend-api/certs/cert.pem');

    try {
      const key = fs.readFileSync(keyPath, 'utf8');
      const cert = fs.readFileSync(certPath, 'utf8');

      this.logger.log('HTTPS server configured with SSL certificates');

      return https.createServer({ key, cert }, expressApp);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to read SSL certificates: ${message}\nExpected paths:\n  Key: ${keyPath}\n  Cert: ${certPath}`
      );
      throw error;
    }
  }
}
