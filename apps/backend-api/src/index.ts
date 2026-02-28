// TypeScript
import express from 'express';
import { loadConfig } from './config';
import { applyCorsMiddleware } from './middleware';
import { createServer } from './server-factory';
import { registerSocketHandlers } from './socket-handlers';

const config = loadConfig();
const app = express();

applyCorsMiddleware(app, config.corsOrigin);

app.get('/api/ice-servers', (_req, res) => {
  res.json({
    iceServers: config.iceServers,
    iceCandidatePoolSize: 10
  });
});

const { server, io } = createServer(app, config);

registerSocketHandlers(io);

server.listen(config.port, config.ip, () => {
  const protocol = config.useHttps ? 'https' : 'http';
  console.log(`Server is running on ${protocol}://${config.ip}:${config.port}`);
});

export default app;
