// TypeScript
import express, { type Application, type Request, type Response } from 'express';
import { Server, type Socket } from 'socket.io';
import * as https from 'node:https';
import * as http from 'node:http';
import * as fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.join(process.cwd(), '.local.env') });

const port = Number(process.env.PORT ?? process.env.BACKEND_PORT) || 3000;
const ip = process.env.IP || '0.0.0.0';
const useHttps = process.env.USE_HTTPS === 'true';

const app: Application = express();
export default app;

const handleSocket = (socket: Socket) => {
  console.log('A user connected:', socket.id);

  socket.on('room', (data: { event: string; roomId: string }) => {
    console.log(
      `Received room event: ${data.event}, roomId: ${data.roomId}, socketId: ${socket.id}`
    );
    if (data.event === 'join') {
      void socket.join(data.roomId);
      console.log(`User ${socket.id} joined room: ${data.roomId}`);
      socket.to(data.roomId).emit('room', { event: 'join', socketId: socket.id });
      socket.emit('room', { event: 'join', roomId: data.roomId });
    }
  });

  type CallEvent = 'offer' | 'answer' | 'candidate';
  type CallPayload = RTCSessionDescriptionInit | RTCIceCandidateInit;

  socket.on('call', (data: { event: CallEvent; data: CallPayload; roomId: string }) => {
    console.log(`Received call event from ${socket.id}:`, JSON.stringify(data));
    socket.to(data.roomId).emit('call', {
      event: data.event,
      data: data.data,
      socketId: socket.id,
      roomId: data.roomId
    });
  });

  socket.on('video', (data: { event: string; time: number; roomId: string }) => {
    console.log('Video event:', data, data.roomId);
    socket.to(data.roomId).emit('video', data);
  });

  socket.on('chat', (data: { user: string; message: string; roomId: string }) => {
    console.log('Chat message:', data);
    socket.to(data.roomId).emit('chat', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('room', { event: 'leave', socketId: socket.id });
      }
    });
  });
};

const allowOrigin = '*';
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

if (process.env.VERCEL) {
  type ServerWithIO = { io?: Server };
  type ResWithSocket = Response & { socket?: { server?: ServerWithIO } };

  const ioHandler = (req: Request, res: ResWithSocket) => {
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const serverRef: ServerWithIO | undefined = res.socket?.server;
    if (serverRef && !serverRef.io) {
      // Attach Socket.IO using the API path to avoid 404s
      const io = new Server(serverRef as unknown as https.Server, {
        path: '/api/socket.io',
        cors: {
          origin: allowOrigin,
          methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
      });
      io.on('connection', handleSocket);
      serverRef.io = io;
    }
    res.end();
  };

  app.get('/api/socket', ioHandler);
} else {
  // ESM-safe dirname resolution for runtime file access.
  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  const server = useHttps
    ? https.createServer(
        {
          key: fs.readFileSync(path.join(currentDir, 'certs/key.pem'), 'utf8'),
          cert: fs.readFileSync(path.join(currentDir, 'certs/cert.pem'), 'utf8')
        },
        app
      )
    : http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: allowOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', handleSocket);

  server.listen(port, ip, () => {
    const protocol = useHttps ? 'https' : 'http';
    console.log(`Server is running on ${protocol}://${ip}:${port}`);
  });
}
