import { Injectable, Logger } from '@nestjs/common';
import type { Namespace, Socket } from 'socket.io';
import type { RoomEvent, RoomPayload } from './socket-events.types';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly socketRooms = new Map<string, string>();

  handleJoinRoom(socket: Socket, io: Namespace, data: RoomEvent): void {
    const { roomId } = data;
    this.logger.log(`User ${socket.id} joining room: ${roomId}`);

    const existingPeers: string[] = [];
    const room = io.adapter.rooms.get(roomId);
    if (room) {
      for (const id of room) {
        if (id !== socket.id) {
          existingPeers.push(id);
        }
      }
    }

    void socket.join(roomId);
    this.socketRooms.set(socket.id, roomId);

    socket.to(roomId).emit('room', { event: 'join', socketId: socket.id });

    const response: RoomPayload = { event: 'join', roomId };
    socket.emit('room', response);

    if (existingPeers.length > 0) {
      socket.emit('room', { event: 'peers', peers: existingPeers, roomId });
    }
  }

  handleLeaveRoom(socket: Socket): void {
    const roomId = this.socketRooms.get(socket.id);
    if (!roomId) {
      this.logger.warn(`No room found for socket ${socket.id}`);
      return;
    }

    this.logger.log(`User ${socket.id} leaving room: ${roomId}`);
    socket.to(roomId).emit('room', { event: 'leave', socketId: socket.id });
    this.socketRooms.delete(socket.id);
  }

  getSocketRoom(socket: Socket): string | undefined {
    const trackedRoom = this.socketRooms.get(socket.id);
    if (trackedRoom) {
      return trackedRoom;
    }

    for (const room of socket.rooms) {
      if (room !== socket.id) {
        return room;
      }
    }

    return undefined;
  }

  clearSocketRoom(socketId: string): void {
    this.socketRooms.delete(socketId);
  }
}
