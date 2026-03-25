import { Injectable, Optional } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import path from 'node:path';
import type { IceServer, ServerConfig } from './interfaces/server-config.interface';

/**
 * Server configuration service
 * Reads configuration from @nestjs/config (which loads from .local.env and .env)
 * Falls back to process.env directly for early bootstrap stage
 */
@Injectable()
export class ServerConfigService {
  private readonly DEFAULT_ICE_SERVERS: IceServer[] = [
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

  constructor(
    @Optional() private readonly configService?: NestConfigService
  ) {}

  getServerConfig(): ServerConfig {
    return {
      port: this.getPort(),
      ip: this.getIp(),
      useHttps: this.getUseHttps(),
      corsOrigin: this.getCorsOrigin(),
      baseDir: this.getBaseDir(),
      iceServers: this.getIceServers(),
      meteredApiKey: this.getMeteredApiKey(),
      meteredAppName: this.getMeteredAppName()
    };
  }

  private getEnv(key: string): string | undefined {
    // Try NestConfigService first if available
    if (this.configService) {
      const value = this.configService.get<string>(key);
      if (value !== undefined) return value;
    }
    // Fall back to process.env
    return process.env[key];
  }

  private getPort(): number {
    const portValue =
      this.getEnv('PORT') ?? this.getEnv('BACKEND_PORT');
    return Number(portValue) || 3000;
  }

  private getIp(): string {
    return this.getEnv('IP') || '0.0.0.0';
  }

  private getUseHttps(): boolean {
    return this.getEnv('USE_HTTPS') === 'true';
  }

  private getCorsOrigin(): string | string[] {
    const corsEnv = this.getEnv('CORS_ORIGIN') || '*';
    
    // If it's just '*', return as is
    if (corsEnv === '*') {
      return corsEnv;
    }
    
    // Support comma-separated origins (e.g., "http://localhost:4200,https://192.168.178.137:4200")
    if (corsEnv.includes(',')) {
      return corsEnv.split(',').map(origin => origin.trim());
    }
    
    return corsEnv;
  }

  private getBaseDir(): string {
    return process.cwd();
  }

  private getIceServers(): IceServer[] {
    const raw = this.getEnv('ICE_SERVERS');
    if (!raw) return this.DEFAULT_ICE_SERVERS;

    try {
      const parsed = JSON.parse(raw) as IceServer[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return this.DEFAULT_ICE_SERVERS;
      }
      return [...this.DEFAULT_ICE_SERVERS, ...parsed];
    } catch (error) {
      console.warn('Failed to parse ICE_SERVERS env var, using defaults');
      return this.DEFAULT_ICE_SERVERS;
    }
  }

  private getMeteredApiKey(): string | undefined {
    return this.getEnv('METERED_API_KEY');
  }

  private getMeteredAppName(): string | undefined {
    return this.getEnv('METERED_APP_NAME');
  }
}
