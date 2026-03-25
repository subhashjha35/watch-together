import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IceServer } from '../config/interfaces/server-config.interface';
import { ServerConfigService } from '../config/config.service';

/**
 * Service for managing ICE servers
 * Handles both static configuration and dynamic TURN credential fetching
 */
@Injectable()
export class IceServersService {
  private readonly logger = new Logger(IceServersService.name);

  constructor(
    @Inject(ServerConfigService) private readonly configService: ServerConfigService
  ) {
    if (!this.configService) {
      this.logger.error('ServerConfigService not injected!');
    } else {
      this.logger.log('IceServersService initialized');
    }
  }

  /**
   * Get ICE servers with fresh TURN credentials if available
   * Falls back to static configuration if Metered API fails or is not configured
   */
  async getIceServers(): Promise<{
    iceServers: IceServer[];
    iceCandidatePoolSize: number;
  }> {
    const DEFAULT_STUN_SERVERS: IceServer[] = [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      }
    ];

    try {
      // Validate service is available
      if (!this.configService) {
        this.logger.error('ConfigService is not available, using default STUN servers');
        return {
          iceServers: DEFAULT_STUN_SERVERS,
          iceCandidatePoolSize: 10
        };
      }

      const config = this.configService.getServerConfig();
      this.logger.debug('Config retrieved successfully');
      
      const iceServers = config.iceServers;
      this.logger.debug(`Loaded ${iceServers.length} ICE servers from config`);

      // If Metered API is configured, attempt to fetch fresh credentials
      if (config.meteredApiKey) {
        this.logger.log('Metered API key found, attempting to fetch fresh TURN credentials');
        try {
          const freshServers = await this.fetchMeteredTurnCredentials(
            config.meteredApiKey,
            config.meteredAppName ?? 'watch-together'
          );
          this.logger.log(`Fetched ${freshServers.length} fresh TURN servers`);
          return {
            iceServers: [...iceServers, ...freshServers],
            iceCandidatePoolSize: 10
          };
        } catch (error) {
          this.logger.warn(
            `Failed to fetch Metered TURN credentials: ${error instanceof Error ? error.message : error}. Using static configuration.`
          );
        }
      } else {
        this.logger.debug('No Metered API key configured, using static ICE servers');
      }

      // Fallback to static configuration
      const response = {
        iceServers,
        iceCandidatePoolSize: 10
      };
      
      this.logger.debug(`Returning ${response.iceServers.length} ICE servers`);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in getIceServers: ${message}`, error instanceof Error ? error.stack : '');
      // Return default STUN servers on any error
      this.logger.warn('Returning default STUN servers due to error');
      return {
        iceServers: DEFAULT_STUN_SERVERS,
        iceCandidatePoolSize: 10
      };
    }
  }

  /**
   * Fetch TURN credentials from Metered API
   * @param apiKey The Metered API key
   * @param appName The Metered application name
   * @throws Propagates fetch errors to the caller
   */
  private async fetchMeteredTurnCredentials(
    apiKey: string,
    appName: string
  ): Promise<IceServer[]> {
    try {
      const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Metered API returned status ${response.status}: ${response.statusText}`
        );
      }

      let turnServers: IceServer[];
      try {
        turnServers = await response.json();
      } catch (parseError) {
        const message = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        throw new Error(`Failed to parse Metered API response: ${message}`);
      }

      if (!Array.isArray(turnServers)) {
        throw new Error('Metered API response is not an array');
      }

      this.logger.log(
        `Successfully fetched ${turnServers.length} TURN servers from Metered API`
      );

      return turnServers;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Metered TURN credentials fetch failed: ${message}`);
      throw error;
    }
  }
}
