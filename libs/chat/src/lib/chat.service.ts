import { Injectable } from '@angular/core';
import { CommonSocketService, IChat, ISocket } from '@watch-together/utils';


export type IChatDataExtended = IChat['dataType'] & { color?: string };

@Injectable({
  providedIn: 'root'
})
export class ChatService extends CommonSocketService implements ISocket<IChat> {

  constructor() {
    super();
  }

  emit(eventGroup: 'chat', data: IChat['dataType']) {
    this.socket.emit(eventGroup, data);
  }

  on(eventGroup: 'chat', listener: (data: IChat['dataType']) => void) {
    this.socket.on(eventGroup, listener);
  }
}
