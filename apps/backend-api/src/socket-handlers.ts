import type { Server, Socket } from 'socket.io';
import type { CallData, ChatMessage, RoomEvent, VideoEvent } from './socket-handlers.types';

class SocketHandler {
  constructor(private readonly io: Server) {}

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
      void socket.join(data.roomId);
      console.log(`User ${socket.id} joined room: ${data.roomId}`);
      socket.to(data.roomId).emit('room', { event: 'join', socketId: socket.id });
      socket.emit('room', { event: 'join', roomId: data.roomId });
    }
  }

  private handleCallEvent(socket: Socket, roomId: string, data: CallData): void {
    const targetRoom = data.roomId ?? roomId;
    console.log(`Received call event from ${socket.id} in room ${targetRoom}:`, data.event);
    socket.to(targetRoom).emit('call', {
      event: data.event,
      data: data.data,
      socketId: socket.id,
      roomId: targetRoom
    });
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
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('room', { event: 'leave', socketId: socket.id });
      }
    });
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
