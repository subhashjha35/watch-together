import { IceServersService } from './ice-servers.service';
import type { ServerConfigService } from '@watch-together/backend-config';

describe('IceServersService', () => {
  it('returns static ICE servers from config when Metered is not configured', async () => {
    const configService = {
      getServerConfig: () => ({
        port: 3000,
        ip: '0.0.0.0',
        useHttps: false,
        corsOrigin: '*',
        baseDir: process.cwd(),
        iceServers: [{ urls: 'stun:example.com' }],
        meteredApiKey: undefined,
        meteredAppName: undefined
      })
    } as ServerConfigService;

    const service = new IceServersService(configService);

    await expect(service.getIceServers()).resolves.toEqual({
      iceServers: [{ urls: 'stun:example.com' }],
      iceCandidatePoolSize: 10
    });
  });
});
