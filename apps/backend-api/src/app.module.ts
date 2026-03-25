import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { SocketModule } from './socket/socket.module';
import { IceServersModule } from './ice-servers/ice-servers.module';

/**
 * Root application module
 * Orchestrates all feature modules and configurations
 */
@Module({
  imports: [ConfigModule, SocketModule, IceServersModule],
  controllers: [],
  providers: []
})
export class AppModule {}
