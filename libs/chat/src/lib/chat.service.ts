import { inject, Injectable } from '@angular/core';
import { IChat, ISocket, SocketService } from '@watch-together/shared';

export type IChatDataExtended = IChat['dataType'] & { color?: string };

@Injectable({
  providedIn: 'root'
})
export class ChatService implements ISocket<IChat> {
  private readonly socketService = inject(SocketService<IChat>);

  emit(eventGroup: 'chat', data: IChat['dataType']): void {
    this.socketService.emit(eventGroup, data);
  }

  on(eventGroup: 'chat', listener: (data: IChat['dataType']) => void): void {
    this.socketService.on(eventGroup, listener);
  }
}
