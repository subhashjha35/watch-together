import * as https from 'node:https';
import * as http from 'node:http';
import * as fs from 'node:fs';
import path from 'node:path';
import type { Application } from 'express';
import { Server } from 'socket.io';
import type { ServerConfig } from './config';

export interface ServerInstance {
  server: http.Server | https.Server;
  io: Server;
}

function createHttpsServer(app: Application, baseDir: string): https.Server {
  return https.createServer(
    {
      key: fs.readFileSync(path.join(baseDir, 'certs/key.pem'), 'utf8'),
      cert: fs.readFileSync(path.join(baseDir, 'certs/cert.pem'), 'utf8')
    },
    app
  );
}

export function createServer(app: Application, config: ServerConfig): ServerInstance {
  const server = config.useHttps ? createHttpsServer(app, config.baseDir) : http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  return { server, io };
}
