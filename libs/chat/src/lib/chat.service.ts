import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export type IChatData = { user: string; text: string };
export type IChatDataExtended = IChatData & { color?: string };

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Connect to the backend server
  }

  emit(eventGroup: 'chat', data: IChatData) {
    this.socket.emit(eventGroup, data);
  }

  on(eventGroup: 'chat', listener: (data: IChatData) => void) {
    this.socket.on(eventGroup, listener);
  }
}
