export interface RoomEvent {
  event: string;
  roomId: string;
}

export type CallEvent = 'offer' | 'answer' | 'candidate';
export type CallPayload = RTCSessionDescriptionInit | RTCIceCandidateInit;

export interface CallData {
  event: CallEvent;
  data: CallPayload;
  roomId?: string;
}

export interface VideoEvent {
  event: string;
  time: number;
}

export interface ChatMessage {
  user: string;
  text: string;
}
