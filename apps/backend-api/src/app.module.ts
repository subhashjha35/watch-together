import { Module } from '@nestjs/common';
import { ConfigModule } from '@watch-together/backend-config';
import { IceServersModule } from '@watch-together/backend-ice-servers';
import { BackendServerModule } from '@watch-together/backend-server';
import { SocketModule } from '@watch-together/backend-socket';

/**
 * Root application module
 * Orchestrates all feature modules and configurations
 */
@Module({
  imports: [ConfigModule, BackendServerModule, SocketModule, IceServersModule],
  controllers: [],
  providers: []
})
export class AppModule {}
