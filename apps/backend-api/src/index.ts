import express, { type Application } from 'express';
import { Server, type Socket } from 'socket.io';
import * as https from 'node:https';
import * as fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load environment variables from .local.env file
dotenv.config({ path: path.join(process.cwd(), '.local.env') });

const port = Number(process.env.BACKEND_PORT) || 3000;
const ip = process.env.IP || '0.0.0.0';

const app: Application = express();

// Socket.IO handler function
const handleSocket = (socket: Socket) => {
  console.log('A user connected:', socket.id);

  socket.on('room', (data: { event: string; roomId: string }) => {
    console.log(
      `Received room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`,
    );
    if (data.event === 'join') {
      void socket.join(data.roomId);
      console.log(`User ${socket.id} joined room: ${data.roomId}`);
      socket
        .to(data.roomId)
        .emit('room', { event: 'join', socketId: socket.id });
      socket.emit('room', { event: 'join', roomId: data.roomId });
    }
  });

  socket.on(
    'call',
    (data: {
      event: 'offer' | 'answer' | 'candidate';
      data: any;
      roomId: string;
    }) => {
      console.log(
        `Received call event from ${socket.id}:`,
        JSON.stringify(data),
      );
      socket.to(data.roomId).emit('call', {
        event: data.event,
        data: data.data,
        socketId: socket.id,
        roomId: data.roomId,
      });
    },
  );

  socket.on(
    'video',
    (data: { event: string; time: number; roomId: string }) => {
      console.log('Video event:', data, data.roomId);
      socket.to(data.roomId).emit('video', data);
    },
  );

  socket.on(
    'chat',
    (data: { user: string; message: string; roomId: string }) => {
      console.log('Chat message:', data);
      socket.to(data.roomId).emit('chat', data);
    },
  );

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('room', { event: 'leave', socketId: socket.id });
      }
    });
  });
};

// Check if running on Vercel
if (process.env.VERCEL) {
  // For Vercel, export the app and handle socket.io as middleware
  const ioHandler = (req: any, res: any) => {
    if (!res.socket.server.io) {
      const io = new Server(res.socket.server, {
        path: '/socket.io',
        cors: {
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
      });

      io.on('connection', handleSocket);
      res.socket.server.io = io;
    }
    res.end();
  };

  app.get('/api/socket', ioHandler);
  module.exports = app;
} else {
  // Local development with HTTPS
  const privateKey = fs.readFileSync(
    path.join(__dirname, 'certs/key.pem'),
    'utf8',
  );
  const certificate = fs.readFileSync(
    path.join(__dirname, 'certs/cert.pem'),
    'utf8',
  );
  const credentials = { key: privateKey, cert: certificate };
  const httpsServer = https.createServer(credentials, app);

  const io = new Server(httpsServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', handleSocket);

  httpsServer.listen(port, ip, () => {
    console.log(`Server is running on https://${ip}:${port}`);
  });
}
