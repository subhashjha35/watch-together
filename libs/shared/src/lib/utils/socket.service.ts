import { Injectable } from '@angular/core';
import {
  IAllSocketEventTypes,
  ICallEvent,
  IChatEventData,
  IRoomEventData,
  ISocket,
  IVideoEventData
} from './socket.type';
import { CommonSocketService } from './common-socket.service';
import { Socket } from 'socket.io-client';

type ClientToServerEvents = {
  video: IVideoEventData;
  chat: IChatEventData;
  call: {
    event: ICallEvent;
    data: RTCSessionDescriptionInit | RTCIceCandidateInit;
    roomId?: string;
    targetSocketId?: string;
  };
  room: IRoomEventData;
};

type ServerToClientEvents = {
  video: IVideoEventData;
  chat: IChatEventData;
  call: {
    event: ICallEvent;
    data: RTCSessionDescriptionInit | RTCIceCandidateInit;
    socketId?: string;
    roomId?: string;
  };
  room: IRoomEventData & { socketId?: string; peers?: string[] };
};

@Injectable({
  providedIn: 'root'
})
export class SocketService<T extends IAllSocketEventTypes>
  extends CommonSocketService
  implements ISocket<T>
{
  constructor() {
    super();
  }

  emit(eventGroup: T['event'], data: T['dataType']) {
    return this.socket.emit(eventGroup satisfies keyof ClientToServerEvents, data);
  }

  on(
    eventGroup: T['event'],
    listener: (data: T['dataType']) => void
  ): Socket<ServerToClientEvents, ClientToServerEvents> {
    return this.socket.on(
      eventGroup satisfies keyof ServerToClientEvents,
      listener as (data: ServerToClientEvents[T['event']]) => void
    );
  }
}
