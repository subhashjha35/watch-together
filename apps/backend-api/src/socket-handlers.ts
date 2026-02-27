import type { Server, Socket } from 'socket.io';
import type { CallData, ChatMessage, RoomEvent, VideoEvent } from './socket-handlers.types';

function handleRoomEvent(socket: Socket, data: RoomEvent): void {
  console.log(`Received room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`);

  if (data.event === 'join') {
    void socket.join(data.roomId);
    console.log(`User ${socket.id} joined room: ${data.roomId}`);
    socket.to(data.roomId).emit('room', { event: 'join', socketId: socket.id });
    socket.emit('room', { event: 'join', roomId: data.roomId });
  }
}

function handleCallEvent(socket: Socket, data: CallData): void {
  console.log(`Received call event from ${socket.id}:`, JSON.stringify(data));
  socket.to(data.roomId).emit('call', {
    event: data.event,
    data: data.data,
    socketId: socket.id,
    roomId: data.roomId
  });
}

function handleVideoEvent(socket: Socket, data: VideoEvent): void {
  console.log('Video event:', data, data.roomId);
  socket.to(data.roomId).emit('video', data);
}

function handleChatMessage(socket: Socket, data: ChatMessage): void {
  console.log('Chat message:', data);
  socket.to(data.roomId).emit('chat', data);
}

function handleDisconnect(socket: Socket): void {
  console.log('User disconnected:', socket.id);
  socket.rooms.forEach((room) => {
    if (room !== socket.id) {
      socket.to(room).emit('room', { event: 'leave', socketId: socket.id });
    }
  });
}

function handleConnection(socket: Socket): void {
  console.log('A user connected:', socket.id);

  socket.on('room', (data: RoomEvent) => handleRoomEvent(socket, data));
  socket.on('call', (data: CallData) => handleCallEvent(socket, data));
  socket.on('video', (data: VideoEvent) => handleVideoEvent(socket, data));
  socket.on('chat', (data: ChatMessage) => handleChatMessage(socket, data));
  socket.on('disconnect', () => handleDisconnect(socket));
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', handleConnection);
}
