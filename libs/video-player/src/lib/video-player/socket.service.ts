import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export type IVideoEvent = {
  event: 'play' | 'pause' | 'seek' | 'videoLoaded';
  time: number;
}


@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Connect to the backend server
  }

  // Emit events to the server
  emit(eventGroup: 'video', data: IVideoEvent) {
    this.socket.emit(eventGroup, data);
  }

  on(eventGroup: 'video', listener: (data: IVideoEvent) => void) {
    this.socket.on(eventGroup, listener);
  }
}
