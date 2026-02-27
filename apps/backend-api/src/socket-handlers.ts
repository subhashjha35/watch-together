import type { Server, Socket } from 'socket.io';
import type { CallData, ChatMessage, RoomEvent, VideoEvent } from './socket-handlers.types';

class SocketHandler {
  constructor(private readonly io: Server) {}

  /** Track socket→room mapping so we can emit 'leave' reliably on disconnect. */
  private readonly socketRooms = new Map<string, string>();

  register(): void {
    this.io.on('connection', (socket) => this.handleConnection(socket));
  }

  private handleConnection(socket: Socket): void {
    console.log('A user connected:', socket.id);

    socket.on('room', (data: RoomEvent) => this.handleRoomEvent(socket, data));
    socket.on('call', (data: CallData) =>
      this.withRoom(socket, 'call', data, this.handleCallEvent)
    );
    socket.on('video', (data: VideoEvent) =>
      this.withRoom(socket, 'video', data, this.handleVideoEvent)
    );
    socket.on('chat', (data: ChatMessage) =>
      this.withRoom(socket, 'chat', data, this.handleChatMessage)
    );
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  private handleRoomEvent(socket: Socket, data: RoomEvent): void {
    console.log(
      `Received room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`
    );

    if (data.event === 'join') {
      // Collect existing peers before this socket joins
      const existingPeers: string[] = [];
      const room = this.io.sockets.adapter.rooms.get(data.roomId);
      if (room) {
        for (const id of room) {
          if (id !== socket.id) {
            existingPeers.push(id);
          }
        }
      }

      void socket.join(data.roomId);
      this.socketRooms.set(socket.id, data.roomId);
      console.log(`User ${socket.id} joined room: ${data.roomId}`);

      // Notify existing peers about the new joiner
      socket.to(data.roomId).emit('room', { event: 'join', socketId: socket.id });

      // Send existing peers list to the new joiner
      socket.emit('room', { event: 'join', roomId: data.roomId });
      if (existingPeers.length > 0) {
        socket.emit('room', { event: 'peers', peers: existingPeers, roomId: data.roomId });
      }
    }
  }

  private handleCallEvent(socket: Socket, roomId: string, data: CallData): void {
    const targetRoom = data.roomId ?? roomId;
    console.log(`Received call event from ${socket.id} in room ${targetRoom}:`, data.event);

    const payload = {
      event: data.event,
      data: data.data,
      socketId: socket.id,
      roomId: targetRoom
    };

    // If a specific target is specified, send only to that peer
    if (data.targetSocketId) {
      socket.to(data.targetSocketId).emit('call', payload);
    } else {
      socket.to(targetRoom).emit('call', payload);
    }
  }

  private handleVideoEvent(socket: Socket, roomId: string, data: VideoEvent): void {
    console.log(`Video event from ${socket.id} in room ${roomId}:`, data.event);
    socket.to(roomId).emit('video', data);
  }

  private handleChatMessage(socket: Socket, roomId: string, data: ChatMessage): void {
    console.log(`Chat message from ${socket.id} in room ${roomId}:`, data.text);
    socket.to(roomId).emit('chat', data);
  }

  private handleDisconnect(socket: Socket): void {
    console.log('User disconnected:', socket.id);
    const room = this.socketRooms.get(socket.id);
    if (room) {
      socket.to(room).emit('room', { event: 'leave', socketId: socket.id });
      this.socketRooms.delete(socket.id);
    }
  }

  /**
   * Resolves the socket's room and invokes the handler.
   * Drops the event with a warning if the socket hasn't joined any room.
   */
  private withRoom<T>(
    socket: Socket,
    eventName: string,
    data: T,
    handler: (socket: Socket, roomId: string, data: T) => void
  ): void {
    const roomId = this.getSocketRoom(socket);
    if (!roomId) {
      console.warn(`${eventName} event from ${socket.id} ignored — not in any room`);
      return;
    }
    handler.call(this, socket, roomId, data);
  }

  /**
   * Returns the room the socket has joined (excluding its own default room).
   */
  private getSocketRoom(socket: Socket): string | undefined {
    for (const room of socket.rooms) {
      if (room !== socket.id) return room;
    }
    return undefined;
  }
}

export function registerSocketHandlers(io: Server): void {
  new SocketHandler(io).register();
}
