import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { IChat, ISocket } from '@watch-together/libs';

export type IChatDataExtended = IChat['dataType'] & { color?: string };

@Injectable({
  providedIn: 'root'
})
export class ChatService implements ISocket<IChat> {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Connect to the backend server
  }


  emit(eventGroup: 'chat', data: IChat['dataType']) {
    this.socket.emit(eventGroup, data);
  }

  on(eventGroup: 'chat', listener: (data: IChat['dataType']) => void) {
    this.socket.on(eventGroup, listener);
  }
}
