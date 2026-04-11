import { Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type { CallData, ChatMessage, RoomEvent, VideoEvent } from './socket-events.types';
import { BroadcastService } from './broadcast.service';
import { RoomService } from './room.service';

@WebSocketGateway({
  cors: true,
  namespace: '/'
})
@UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Namespace;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    @Inject(RoomService) private readonly roomService: RoomService,
    @Inject(BroadcastService) private readonly broadcastService: BroadcastService
  ) {}

  handleConnection(socket: Socket): void {
    this.logger.log(`✓ User connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket): void {
    this.logger.log(`✗ User disconnected: ${socket.id}`);
    this.roomService.handleLeaveRoom(socket);
  }

  @SubscribeMessage('room')
  handleRoomEvent(socket: Socket, data: RoomEvent): void {
    this.logger.log(`Room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`);

    if (data.event === 'join') {
      this.roomService.handleJoinRoom(socket, this.server, data);
      return;
    }

    if (data.event === 'leave') {
      this.roomService.handleLeaveRoom(socket);
    }
  }

  @SubscribeMessage('call')
  handleCallEvent(socket: Socket, data: CallData): void {
    const roomId = this.roomService.getSocketRoom(socket);

    if (!roomId) {
      this.logger.warn(`Call event from ${socket.id} ignored — not in any room`);
      return;
    }

    this.broadcastService.broadcastCallEvent(socket, roomId, data);
  }

  @SubscribeMessage('video')
  handleVideoEvent(socket: Socket, data: VideoEvent): void {
    const roomId = this.roomService.getSocketRoom(socket);

    if (!roomId) {
      this.logger.warn(`Video event from ${socket.id} ignored — not in any room`);
      return;
    }

    this.broadcastService.broadcastVideoEvent(socket, roomId, data);
  }

  @SubscribeMessage('chat')
  handleChatMessage(socket: Socket, data: ChatMessage): void {
    const roomId = this.roomService.getSocketRoom(socket);

    if (!roomId) {
      this.logger.warn(`Chat event from ${socket.id} ignored — not in any room`);
      return;
    }

    this.broadcastService.broadcastChatMessage(socket, roomId, data);
  }
}
