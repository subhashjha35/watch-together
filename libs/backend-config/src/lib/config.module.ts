import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as path from 'node:path';
import { ServerConfigService } from './server-config.service';

const envPath = path.join(process.cwd(), '.local.env');

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: [envPath, '.env'],
      isGlobal: true
    })
  ],
  providers: [ServerConfigService],
  exports: [ServerConfigService, NestConfigModule]
})
export class ConfigModule {}
