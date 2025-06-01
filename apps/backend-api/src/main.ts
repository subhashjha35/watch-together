import express, { Application } from 'express';
import { Server, Socket } from 'socket.io';
import * as https from 'node:https';
import * as fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load environment variables from .local.env file
dotenv.config({ path: path.join(process.cwd(), '.local.env') });

const port = Number(process.env.BACKEND_PORT) || 3000;
const ip = process.env.IP || '127.0.0.1';

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
  return [...socket.rooms][0];
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

// Create a GET route to serve environment variables
app.get('/config', (_req, res) => {
  res.json({
    IP: process.env.IP,
    BACKEND_PORT: process.env.BACKEND_PORT,
    FRONTEND_PORT: process.env.FRONTEND_PORT
  });
});

// Start the server
httpsServer.listen(port, ip, () => {
  console.log(`Server is running on https://${ip}:${port}`);
});
