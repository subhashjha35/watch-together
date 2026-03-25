import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { RoomService } from './services/room.service';
import { BroadcastService } from './services/broadcast.service';

@Module({
  providers: [SocketGateway, RoomService, BroadcastService],
  exports: [RoomService, BroadcastService]
})
export class SocketModule {}
