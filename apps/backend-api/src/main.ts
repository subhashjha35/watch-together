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
    origin: '*', // Restrict to your frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);

  socket.on('room', (data: { event: string; roomId: string }) => {
    console.log(`Received room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`);
    if (data.event === 'join') {
      socket.join(data.roomId);
      console.log(`User ${socket.id} joined room: ${data.roomId}`);
      // Notify other users in the room
      socket.to(data.roomId).emit('room', { event: 'join', socketId: socket.id });
      // Send room confirmation to the joining user
      socket.emit('room', { event: 'join', roomId: data.roomId });
    }
  });

  socket.on('call', (data: { event: 'offer' | 'answer' | 'candidate'; data: any; roomId: string }) => {
    console.log(`Received call event from ${socket.id}:`, JSON.stringify(data));
    socket.to(data.roomId).emit('call', {
      event: data.event,
      data: data.data,
      socketId: socket.id,
      roomId: data.roomId // Include roomId
    });
  });

  socket.on('video', (data: { event: string; time: number; roomId: string }) => {
    console.log('Video MILLvideo event:', data, data.roomId);
    socket.to(data.roomId).emit('video', data);
  });

  socket.on('chat', (data: { user: string; message: string; roomId: string }) => {
    console.log('Chat message:', data);
    socket.to(data.roomId).emit('chat', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('room', { event: 'leave', socketId: socket.id });
      }
    });
  });
});

app.get('/config', (_req, res) => {
  res.json({
    IP: process.env.IP,
    BACKEND_PORT: process.env.BACKEND_PORT,
    FRONTEND_PORT: process.env.FRONTEND_PORT
  });
});

httpsServer.listen(port, ip, () => {
  console.log(`Server is running on https://${ip}:${port}`);
});
