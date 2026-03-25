// TypeScript
import express from 'express';
import { loadConfig } from './config';
import { applyCorsMiddleware } from './middleware';
import { createServer } from './server-factory';
import { registerSocketHandlers } from './socket-handlers';

const config = loadConfig();
const app = express();

applyCorsMiddleware(app, config.corsOrigin);

app.get('/api/ice-servers', async (_req, res) => {
  // If a Metered API key is configured, fetch fresh TURN credentials
  if (config.meteredApiKey) {
    try {
      const appName = config.meteredAppName ?? 'watch-together';
      const response = await fetch(
        `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${config.meteredApiKey}`
      );
      if (response.ok) {
        const turnServers = await response.json();
        res.json({
          iceServers: [...config.iceServers, ...turnServers],
          iceCandidatePoolSize: 10
        });
        return;
      }
      console.warn('Metered API returned non-OK status:', response.status);
    } catch (error) {
      console.warn('Failed to fetch Metered TURN credentials:', error);
    }
  }
  // Fallback to static config
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
