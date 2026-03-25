import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
  Inject
} from '@nestjs/common';
import type { IceServer } from '../config/interfaces/server-config.interface';
import { IceServersService } from './ice-servers.service';

/**
 * REST Controller for ICE servers endpoint
 * Provides WebRTC ICE server configuration to clients
 */
@Controller('api')
export class IceServersController {
  private readonly logger = new Logger(IceServersController.name);

  constructor(
    @Inject(IceServersService) private readonly iceServersService: IceServersService
  ) {
    if (!this.iceServersService) {
      this.logger.error('IceServersService is not injected!');
    } else {
      this.logger.log('IceServersController initialized with IceServersService');
    }
  }

  /**
   * GET /api/ice-servers
   *
   * Returns ICE server configuration including STUN and TURN servers
   * Attempts to fetch fresh TURN credentials if Metered API is configured
   *
   * @returns ICE servers configuration with candidate pool size
   */
  @Get('ice-servers')
  @HttpCode(HttpStatus.OK)
  async getIceServers(): Promise<{
    iceServers: IceServer[];
    iceCandidatePoolSize: number;
  }> {
    try {
      if (!this.iceServersService) {
        const errorMsg = 'IceServersService is not available';
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      this.logger.debug('Calling getIceServers on service');
      return await this.iceServersService.getIceServers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get ICE servers: ${errorMessage}`,
        error instanceof Error ? error.stack : ''
      );
      throw new InternalServerErrorException('Failed to retrieve ICE servers');
    }
  }
}
