import http from 'http';
import express, { Application } from 'express';
import { Server, Socket } from 'socket.io';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app: Application = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Allow requests from any origin (or restrict to your front-end URL)
    methods: ['GET', 'POST']
  }
});

// Handle Socket.IO connections
io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);

  socket.on('video', (data: { event: string; time: number }) => {
    console.log('video', data);
    socket.broadcast.emit('video', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
