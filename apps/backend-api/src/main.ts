import express, { Application } from 'express';
import { Server, Socket } from 'socket.io';
import * as https from 'node:https';
import * as fs from 'node:fs';
import path from 'node:path';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app: Application = express();

const privateKey = fs.readFileSync(path.join(process.cwd(), 'apps/backend-api/src/certs/key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(process.cwd(), 'apps/backend-api/src/certs/cert.pem'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

const io = new Server(httpsServer, {
  cors: {
    origin: '*', // Allow requests from any origin (or restrict to your front-end URL)
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});


const createRoom = (socket: Socket, roomId = 'movie room') => {
  socket.join(roomId);
  return [...socket.rooms][1];
};
// Handle Socket.IO connections
io.on('connection', (socket: Socket, roomIdText = '') => {
  const roomId = createRoom(socket, roomIdText);
  console.log(roomId);
  socket.emit('room', { roomId: roomId });

  console.log('A user connected:', socket.id);
  console.log(socket.data);
  socket.broadcast.emit('user', { userId: socket.id });

  socket.on('video', (data: { event: string; time: number }) => {
    console.log('video', data);
    socket.broadcast.emit('video', data);
  });

  socket.on('chat', (data: { user: string; message: string }) => {
    console.log('chat', data, socket.id);
    socket.broadcast.emit('chat', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.rooms);
  });

  // Handle WebRTC offer
  socket.on('offer', (roomId, offer) => {
    socket.to(roomId).emit('offer', socket.id, offer);
  });

  // Handle WebRTC answer
  socket.on('answer', (roomId, answer) => {
    socket.to(roomId).emit('answer', socket.id, answer);
  });

  // Handle ICE candidate
  socket.on('ice-candidate', (roomId, candidate) => {
    socket.to(roomId).emit('ice-candidate', socket.id, candidate);
  });
});

// Start the server
httpsServer.listen(port, '192.168.178.88', () => {
  console.log(`Server is running on https://192.168.178.88:${port}`);
});
