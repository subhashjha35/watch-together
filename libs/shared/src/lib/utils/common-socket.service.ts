import { inject, Injectable, InjectionToken } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export const ENV_DATA = new InjectionToken<Env>('ENV_DATA');
type Env = {
  IP: string;
  BACKEND_PORT: number;
  FRONTEND_PORT: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommonSocketService {
  public socket!: Socket;
  private envData = inject(ENV_DATA);

  constructor() {
    const envData = this.envData;
    this.socket = io(`${envData.IP}:${envData.BACKEND_PORT}`); // Connect to the backend server
  }
}
