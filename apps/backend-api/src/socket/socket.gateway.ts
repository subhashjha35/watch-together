import { Inject, Logger, UseFilters, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type { CallData, ChatMessage, RoomEvent, VideoEvent } from './types/socket-events.types';
import { RoomService } from './services/room.service';
import { BroadcastService } from './services/broadcast.service';

/**
 * WebSocket Gateway for managing real-time socket connections
 * Handles room management, calls, video, and chat events
 *
 * Gateway features:
 * - Room-based event distribution
 * - Peer discovery and connection management
 * - Real-time message broadcasting
 * - Graceful disconnect handling
 */
@WebSocketGateway({
  cors: true,
  namespace: '/'
})
@UseFilters()
@UseInterceptors()
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
    this.roomService.handleLeaveRoom(socket, this.server);
  }

  /**
   * Handle room join/leave events
   * Manages socket membership and peer discovery
   */
  @SubscribeMessage('room')
  handleRoomEvent(socket: Socket, data: RoomEvent): void {
    this.logger.log(`Room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`);

    if (data.event === 'join') {
      this.roomService.handleJoinRoom(socket, this.server, data);
    } else if (data.event === 'leave') {
      this.roomService.handleLeaveRoom(socket, this.server);
    }
  }

  /**
   * Handle call signaling events (offer, answer, candidate)
   * Includes validation that socket is in a room
   */
  @SubscribeMessage('call')
  handleCallEvent(socket: Socket, data: CallData): void {
    const roomId = this.roomService.getSocketRoom(socket);

    if (!roomId) {
      this.logger.warn(`Call event from ${socket.id} ignored — not in any room`);
      return;
    }

    this.broadcastService.broadcastCallEvent(socket, roomId, data);
  }

  /**
   * Handle video playback sync events
   * Ensures all peers see synchronized video playback
   */
  @SubscribeMessage('video')
  handleVideoEvent(socket: Socket, data: VideoEvent): void {
    const roomId = this.roomService.getSocketRoom(socket);

    if (!roomId) {
      this.logger.warn(`Video event from ${socket.id} ignored — not in any room`);
      return;
    }

    this.broadcastService.broadcastVideoEvent(socket, roomId, data);
  }

  /**
   * Handle chat messages
   * Broadcasts messages to all peers in the room
   */
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
