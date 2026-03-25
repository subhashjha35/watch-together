import { Injectable, Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type { RoomEvent, RoomPayload } from '../types/socket-events.types';

/**
 * Service for managing room operations and socket-to-room tracking
 * Implements clean separation of room logic from request handling
 */
@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  /** Track socket→room mapping for reliable disconnect handling */
  private readonly socketRooms = new Map<string, string>();

  /**
   * Handle socket joining a room
   * Broadcasts join event to existing peers and sends peer list to new joiner
   */
  handleJoinRoom(socket: Socket, io: Server, data: RoomEvent): void {
    const { roomId } = data;
    this.logger.log(`User ${socket.id} joining room: ${roomId}`);

    // Collect existing peers before this socket joins
    const existingPeers: string[] = [];
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      for (const id of room) {
        if (id !== socket.id) {
          existingPeers.push(id);
        }
      }
    }

    // Join the room and track the mapping
    void socket.join(roomId);
    this.socketRooms.set(socket.id, roomId);

    // Notify existing peers about the new joiner
    socket.to(roomId).emit('room', { event: 'join', socketId: socket.id });

    // Send existing peers list to the new joiner
    const response: RoomPayload = { event: 'join', roomId };
    socket.emit('room', response);

    if (existingPeers.length > 0) {
      socket.emit('room', { event: 'peers', peers: existingPeers, roomId });
    }
  }

  /**
   * Handle socket leaving a room (disconnect or explicit leave)
   * Notifies other peers in the room about the departure
   */
  handleLeaveRoom(socket: Socket, io: Server): void {
    const roomId = this.socketRooms.get(socket.id);
    if (!roomId) {
      this.logger.warn(`No room found for socket ${socket.id}`);
      return;
    }

    this.logger.log(`User ${socket.id} leaving room: ${roomId}`);
    socket.to(roomId).emit('room', { event: 'leave', socketId: socket.id });
    this.socketRooms.delete(socket.id);
  }

  /**
   * Get the room a socket has joined (excluding its own default room)
   */
  getSocketRoom(socket: Socket): string | undefined {
    // First check our tracking map
    const trackedRoom = this.socketRooms.get(socket.id);
    if (trackedRoom) {
      return trackedRoom;
    }

    // Fallback: search through socket.rooms
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        return room;
      }
    }

    return undefined;
  }

  /**
   * Clear room tracking for a socket
   */
  clearSocketRoom(socketId: string): void {
    this.socketRooms.delete(socketId);
  }
}
