import { Module } from '@nestjs/common';
import { ConfigModule } from '@watch-together/backend-config';
import { IceServersController } from './ice-servers.controller';
import { IceServersService } from './ice-servers.service';

@Module({
  imports: [ConfigModule],
  controllers: [IceServersController],
  providers: [IceServersService],
  exports: [IceServersService]
})
export class IceServersModule {}
