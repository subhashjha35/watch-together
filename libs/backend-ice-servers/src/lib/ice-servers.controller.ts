import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import type { IceServer } from '@watch-together/backend-config';
import { IceServersService } from './ice-servers.service';

@Controller('api')
export class IceServersController {
  private readonly logger = new Logger(IceServersController.name);

  constructor(@Inject(IceServersService) private readonly iceServersService: IceServersService) {}

  @Get('ice-servers')
  @HttpCode(HttpStatus.OK)
  async getIceServers(): Promise<{
    iceServers: IceServer[];
    iceCandidatePoolSize: number;
  }> {
    try {
      return await this.iceServersService.getIceServers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get ICE servers: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new InternalServerErrorException('Failed to retrieve ICE servers');
    }
  }
}
