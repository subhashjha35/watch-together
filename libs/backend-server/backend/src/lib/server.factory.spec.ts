import type { Express } from 'express';
import type * as http from 'node:http';
import { ServerFactory } from './server.factory';

const express = require('express') as () => Express;

describe('ServerFactory', () => {
  it('creates an HTTP server when HTTPS is disabled', () => {
    const factory = new ServerFactory();
    const server = factory.createServer(express(), {
      port: 3000,
      ip: '0.0.0.0',
      useHttps: false,
      corsOrigin: '*',
      baseDir: process.cwd(),
      iceServers: []
    });

    expect((server as http.Server).address()).toBeNull();
    server.close();
  });
});
