import { Module } from '@nestjs/common';
import { ConfigModule } from '@watch-together/backend-config/backend';
import { IceServersModule } from '@watch-together/backend-ice-servers/backend';
import { BackendServerModule } from '@watch-together/backend-server/backend';
import { SocketModule } from '@watch-together/backend-socket/backend';

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
