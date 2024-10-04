import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { ISocket, IVideo } from '@watch-together/libs';


@Injectable({
  providedIn: 'root'
})
export class SocketService implements ISocket<IVideo> {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Connect to the backend server
  }

  // Emit events to the server
  emit(eventGroup: 'video', data: IVideo['dataType']) {
    this.socket.emit(eventGroup, data);
  }

  on(eventGroup: 'video', listener: (data: IVideo['dataType']) => void) {
    this.socket.on(eventGroup, listener);
  }
}
