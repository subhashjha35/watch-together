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
  providedIn: 'root',
})
export abstract class CommonSocketService {
  public socket!: Socket<ServerToClientEvents, ClientToServerEvents>;
  private readonly envData = inject(ENV_DATA);

  protected constructor() {
    const envData = this.envData;
    this.socket = io(`${envData.HOST}`); // Connect to the backend server
  }
}
