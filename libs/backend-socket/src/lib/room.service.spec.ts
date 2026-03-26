import type { Namespace, Socket } from 'socket.io';
import { RoomService } from './room.service';

describe('RoomService', () => {
  it('falls back to the socket room set when no tracked mapping exists', () => {
    const service = new RoomService();
    const socket = {
      id: 'socket-1',
      rooms: new Set(['socket-1', 'room-123'])
    } as unknown as Socket;

    expect(service.getSocketRoom(socket)).toBe('room-123');
  });

  it('clears tracked rooms explicitly', () => {
    const service = new RoomService();
    const socket = {
      id: 'socket-1',
      rooms: new Set(['socket-1']),
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() }))
    } as unknown as Socket;
    const namespace = {
      adapter: {
        rooms: new Map<string, Set<string>>()
      }
    } as unknown as Namespace;

    service.handleJoinRoom(socket, namespace, { event: 'join', roomId: 'room-123' });
    service.clearSocketRoom('socket-1');

    expect(service.getSocketRoom(socket)).toBeUndefined();
  });
});
