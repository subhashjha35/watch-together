export type ISocket<T extends IVideo | IChat> = {
  emit: (eventGroup: T['event'], data: T['dataType']) => void;
  on: (eventGroup: T['event'], listener: (data: T['dataType']) => void) => void;
}

type IVideoEvent = 'play' | 'pause' | 'seek' | 'videoLoaded';
type IVideoEventData = {
  event: IVideoEvent;
  time: number;
}

export type IVideo = {
  event: 'video';
  dataType: IVideoEventData;
}
type IChatData = { user: string; text: string };

export type IChat = {
  event: 'chat';
  dataType: IChatData;
}
