import { Module } from '@nestjs/common';
import { IceServersController } from './ice-servers.controller';
import { IceServersService } from './ice-servers.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [IceServersController],
  providers: [IceServersService],
  exports: [IceServersService]
})
export class IceServersModule {}
