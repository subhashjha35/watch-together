import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ServerConfigService } from './config.service';
import { ServerFactory } from '../common/factories/server.factory';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.local.env');

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: [envPath, '.env'],
      isGlobal: true
    })
  ],
  providers: [ServerConfigService, ServerFactory],
  exports: [ServerConfigService, ServerFactory, NestConfigModule]
})
export class ConfigModule {}
