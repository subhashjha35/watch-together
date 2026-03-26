import { Inject, Injectable, Logger } from '@nestjs/common';
import { type IceServer, ServerConfigService } from '@watch-together/backend-config';

const DEFAULT_STUN_SERVERS: IceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302'
    ]
  }
];

@Injectable()
export class IceServersService {
  private readonly logger = new Logger(IceServersService.name);

  constructor(@Inject(ServerConfigService) private readonly configService: ServerConfigService) {}

  async getIceServers(): Promise<{
    iceServers: IceServer[];
    iceCandidatePoolSize: number;
  }> {
    try {
      const config = this.configService.getServerConfig();
      const iceServers = config.iceServers;

      if (config.meteredApiKey) {
        try {
          const freshServers = await this.fetchMeteredTurnCredentials(
            config.meteredApiKey,
            config.meteredAppName ?? 'watch-together'
          );

          return {
            iceServers: [...iceServers, ...freshServers],
            iceCandidatePoolSize: 10
          };
        } catch (error) {
          this.logger.warn(
            `Failed to fetch Metered TURN credentials: ${error instanceof Error ? error.message : error}. Using static configuration.`
          );
        }
      }

      return {
        iceServers,
        iceCandidatePoolSize: 10
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in getIceServers: ${message}`,
        error instanceof Error ? error.stack : undefined
      );

      return {
        iceServers: DEFAULT_STUN_SERVERS,
        iceCandidatePoolSize: 10
      };
    }
  }

  private async fetchMeteredTurnCredentials(apiKey: string, appName: string): Promise<IceServer[]> {
    const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Metered API returned status ${response.status}: ${response.statusText}`);
    }

    const turnServers = (await response.json()) as unknown;

    if (!Array.isArray(turnServers)) {
      throw new Error('Metered API response is not an array');
    }

    return turnServers as IceServer[];
  }
}
