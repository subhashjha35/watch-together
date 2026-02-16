export type IAllSocketEventTypes = IVideo | IChat | ICall | IRoom;

export type ISocket<T extends IAllSocketEventTypes> = {
  emit: ISocketEmitMethod<T>;
  on: ISocketOnMethod<T>;
};
export type ISocketEmitMethod<T extends IAllSocketEventTypes> = (
  eventGroup: T['event'],
  data: T['dataType']
) => void;
export type ISocketOnMethod<T extends IAllSocketEventTypes> = (
  eventGroup: T['event'],
  listener: (data: T['dataType']) => void
) => void;

type IVideoEvent = 'play' | 'pause' | 'seek' | 'videoLoaded';
export type IVideoEventData = {
  event: IVideoEvent;
  time: number;
};

export type IVideo = {
  event: 'video';
  dataType: IVideoEventData;
};
export type IChatEventData = { user: string; text: string };

export type IChat = {
  event: 'chat';
  dataType: IChatEventData;
};

export type ICallEvent = 'offer' | 'answer' | 'candidate';
export type ICall = {
  event: 'call';
  dataType: {
    event: ICallEvent;
    data: RTCSessionDescriptionInit | RTCIceCandidateInit;
    roomId?: string; // Optional roomId for call events
  };
};
export type IRoomEvent = 'join' | 'leave';
export type IRoomEventData = {
  event: IRoomEvent;
  roomId: string;
};
export type IRoom = {
  event: 'room';
  dataType: IRoomEventData;
};
