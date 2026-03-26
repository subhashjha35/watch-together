import { Module } from '@nestjs/common';
import { ServerFactory } from './server.factory';

@Module({
  providers: [ServerFactory],
  exports: [ServerFactory]
})
export class BackendServerModule {}
