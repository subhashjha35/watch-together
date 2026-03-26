import { ServerConfigService } from './server-config.service';

describe('ServerConfigService', () => {
  afterEach(() => {
    delete process.env['CORS_ORIGIN'];
    delete process.env['PORT'];
    delete process.env['BACKEND_PORT'];
    delete process.env['ICE_SERVERS'];
  });

  it('parses comma-separated CORS origins', () => {
    process.env['CORS_ORIGIN'] = 'http://localhost:4200, https://example.com';

    const service = new ServerConfigService();

    expect(service.getServerConfig().corsOrigin).toEqual([
      'http://localhost:4200',
      'https://example.com'
    ]);
  });

  it('falls back to the default port when env values are missing', () => {
    const service = new ServerConfigService();

    expect(service.getServerConfig().port).toBe(3000);
  });

  it('merges custom ICE servers with the defaults', () => {
    process.env['ICE_SERVERS'] = JSON.stringify([{ urls: 'turn:example.com' }]);

    const service = new ServerConfigService();
    const config = service.getServerConfig();

    expect(config.iceServers).toEqual(expect.arrayContaining([{ urls: 'turn:example.com' }]));
    expect(config.iceServers.length).toBeGreaterThan(1);
  });
});
