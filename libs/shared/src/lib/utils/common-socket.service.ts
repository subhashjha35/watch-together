import { inject, Injectable, InjectionToken } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { IAllSocketEventTypes } from './socket.type';

export const ENV_DATA = new InjectionToken<Env>('ENV_DATA');

type Env = {
  IP: string;
  BACKEND_PORT: number;
  FRONTEND_PORT: number;
}
type ServerToClientEvents = Record<IAllSocketEventTypes['event'], any>;
type ClientToServerEvents = Record<IAllSocketEventTypes['event'], any>;

@Injectable({
  providedIn: 'root',
})
export abstract class CommonSocketService {
  public socket!: Socket<ServerToClientEvents, ClientToServerEvents>;
  private readonly envData = inject(ENV_DATA);

  protected constructor() {
    const envData = this.envData;
    this.socket = io(`${envData.IP}:${envData.BACKEND_PORT}`); // Connect to the backend server
  }
}
