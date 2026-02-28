import { inject, Injectable } from '@angular/core';
import { ENV_DATA } from './common-socket.service';

const STUN_ONLY_FALLBACK: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ],
  iceCandidatePoolSize: 10
};

@Injectable({
  providedIn: 'root'
})
export class IceConfigService {
  private readonly envData = inject(ENV_DATA);
  private cachedConfig: RTCConfiguration | null = null;

  async getConfig(): Promise<RTCConfiguration> {
    if (this.cachedConfig) return this.cachedConfig;

    try {
      const response = await fetch(`${this.envData.HOST}/api/ice-servers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const config: RTCConfiguration = await response.json();
      this.cachedConfig = config;
      console.log('ICE configuration loaded from server:', config.iceServers?.length, 'server(s)');
      return config;
    } catch (error) {
      console.warn('Failed to fetch ICE config from server, using STUN-only fallback:', error);
      return STUN_ONLY_FALLBACK;
    }
  }
}
