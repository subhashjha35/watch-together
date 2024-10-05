import http from 'http';
import express, { Application, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app: Application = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Allow requests from any origin (or restrict to your front-end URL)
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.get('/hi', (req: Request, res: Response) => {
  return res.status(200).send('welcome to the backend');
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
});

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
