import { InternalServerErrorException } from '@nestjs/common';
import type { IceServersService } from './ice-servers.service';
import { IceServersController } from './ice-servers.controller';

describe('IceServersController', () => {
  it('returns the service response', async () => {
    const service = {
      getIceServers: jest.fn().mockResolvedValue({
        iceServers: [{ urls: 'stun:example.com' }],
        iceCandidatePoolSize: 10
      })
    } as unknown as IceServersService;

    const controller = new IceServersController(service);

    await expect(controller.getIceServers()).resolves.toEqual({
      iceServers: [{ urls: 'stun:example.com' }],
      iceCandidatePoolSize: 10
    });
  });

  it('wraps service failures in an internal server error', async () => {
    const service = {
      getIceServers: jest.fn().mockRejectedValue(new Error('boom'))
    } as unknown as IceServersService;

    const controller = new IceServersController(service);

    await expect(controller.getIceServers()).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
