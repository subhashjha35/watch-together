import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class CommonSocketService {
  protected socket: Socket;

  constructor() {
    this.socket = io('http://192.168.178.88:3000'); // Connect to the backend server
    console.error('Common Socket Service loaded');
  }
}
