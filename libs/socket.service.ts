import { Injectable } from '@angular/core';
import { CommonSocketService, ISocket, IVideo } from '@watch-together/libs';


@Injectable({
  providedIn: 'root'
})
export class SocketService extends CommonSocketService implements ISocket<IVideo> {

  constructor() {
    super();
  }

  // Emit events to the server
  emit(eventGroup: 'video', data: IVideo['dataType']) {
    this.socket.emit(eventGroup, data);
  }

  on(eventGroup: 'video', listener: (data: IVideo['dataType']) => void) {
    this.socket.on(eventGroup, listener);
  }
}
