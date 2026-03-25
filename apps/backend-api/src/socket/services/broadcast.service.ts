import { Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import type { CallData, VideoEvent, ChatMessage } from '../types/socket-events.types';

/**
 * Service for broadcasting events to rooms
 * Handles call, video, and chat event distribution
 */
@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  /**
   * Broadcast call event to peers in the room
   * Supports targeting specific peers or broadcasting to all
   */
  broadcastCallEvent(socket: Socket, roomId: string, data: CallData): void {
    this.logger.log(
      `Call event from ${socket.id} in room ${roomId}: ${data.event}`
    );

    const payload = {
      event: data.event,
      data: data.data,
      socketId: socket.id,
      roomId
    };

    // If a specific target is specified, send only to that peer
    if (data.targetSocketId) {
      socket.to(data.targetSocketId).emit('call', payload);
    } else {
      socket.to(roomId).emit('call', payload);
    }
  }

  /**
   * Broadcast video event to all peers in the room
   */
  broadcastVideoEvent(socket: Socket, roomId: string, data: VideoEvent): void {
    this.logger.log(
      `Video event from ${socket.id} in room ${roomId}: ${data.event}`
    );
    socket.to(roomId).emit('video', data);
  }

  /**
   * Broadcast chat message to all peers in the room
   */
  broadcastChatMessage(socket: Socket, roomId: string, data: ChatMessage): void {
    this.logger.log(
      `Chat message from ${socket.id} in room ${roomId}: ${data.text}`
    );
    socket.to(roomId).emit('chat', data);
  }
}
