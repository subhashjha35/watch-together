import { inject, Injectable, InjectionToken } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { IAllSocketEventTypes } from './socket.type';

export const ENV_DATA = new InjectionToken<Env>('ENV_DATA');

type Env = {
  HOST: string;
};
type ServerToClientEvents = Record<IAllSocketEventTypes['event'], any>;
type ClientToServerEvents = Record<IAllSocketEventTypes['event'], any>;

@Injectable({
  providedIn: 'root'
})
export abstract class CommonSocketService {
  public socket!: Socket<ServerToClientEvents, ClientToServerEvents>;
  private readonly envData = inject(ENV_DATA);

  protected constructor() {
    const envData = this.envData;
    
    // Configure Socket.IO connection with proper options
    const socketOptions: any = {
      path: '/socket.io/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // Use both websocket and polling transports
      transports: ['websocket', 'polling'],
      withCredentials: true
    };

    // Remove rejectUnauthorized - it's only for Node.js
    // Browsers handle certificate validation differently
    
    console.log('Socket.IO options:', socketOptions);
    console.log('Connecting to:', envData.HOST);
    
    this.socket = io(`${envData.HOST}`, socketOptions);

    // Log connection events for debugging
    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });
  }
}
