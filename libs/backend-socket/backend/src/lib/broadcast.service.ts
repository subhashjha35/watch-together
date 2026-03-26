import { Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import type { CallData, ChatMessage, VideoEvent } from './socket-events.types';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  broadcastCallEvent(socket: Socket, roomId: string, data: CallData): void {
    this.logger.log(`Call event from ${socket.id} in room ${roomId}: ${data.event}`);

    const payload = {
      event: data.event,
      data: data.data,
      socketId: socket.id,
      roomId
    };

    if (data.targetSocketId) {
      socket.to(data.targetSocketId).emit('call', payload);
      return;
    }

    socket.to(roomId).emit('call', payload);
  }

  broadcastVideoEvent(socket: Socket, roomId: string, data: VideoEvent): void {
    this.logger.log(`Video event from ${socket.id} in room ${roomId}: ${data.event}`);
    socket.to(roomId).emit('video', data);
  }

  broadcastChatMessage(socket: Socket, roomId: string, data: ChatMessage): void {
    this.logger.log(`Chat message from ${socket.id} in room ${roomId}: ${data.text}`);
    socket.to(roomId).emit('chat', data);
  }
}
