import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type { IceServer, ServerConfig } from './server-config.interface';

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

@Injectable()
export class ServerConfigService {
  private readonly logger = new Logger(ServerConfigService.name);

  constructor(
    @Optional() @Inject(NestConfigService) private readonly configService?: NestConfigService
  ) {}

  getServerConfig(): ServerConfig {
    return {
      port: this.getPort(),
      ip: this.getIp(),
      useHttps: this.getUseHttps(),
      corsOrigin: this.getCorsOrigin(),
      baseDir: process.cwd(),
      iceServers: this.getIceServers(),
      meteredApiKey: this.getMeteredApiKey(),
      meteredAppName: this.getMeteredAppName()
    };
  }

  private getEnv(key: string): string | undefined {
    const value = this.configService?.get<string>(key);
    return value ?? process.env[key];
  }

  private getPort(): number {
    const portValue = this.getEnv('PORT') ?? this.getEnv('BACKEND_PORT');
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

    if (corsEnv === '*') {
      return corsEnv;
    }

    if (corsEnv.includes(',')) {
      return corsEnv.split(',').map((origin) => origin.trim());
    }

    return corsEnv;
  }

  private getIceServers(): IceServer[] {
    const raw = this.getEnv('ICE_SERVERS');
    if (!raw) {
      return DEFAULT_ICE_SERVERS;
    }

    try {
      const parsed = JSON.parse(raw) as IceServer[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_ICE_SERVERS;
      }

      return [...DEFAULT_ICE_SERVERS, ...parsed];
    } catch {
      this.logger.warn('Failed to parse ICE_SERVERS env var, using defaults');
      return DEFAULT_ICE_SERVERS;
    }
  }

  private getMeteredApiKey(): string | undefined {
    return this.getEnv('METERED_API_KEY');
  }

  private getMeteredAppName(): string | undefined {
    return this.getEnv('METERED_APP_NAME');
  }
}
