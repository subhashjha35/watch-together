import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { RoomService } from './room.service';
import { SocketGateway } from './socket.gateway';

@Module({
  providers: [SocketGateway, RoomService, BroadcastService],
  exports: [RoomService, BroadcastService]
})
export class SocketModule {}
