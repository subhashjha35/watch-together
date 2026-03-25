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
    if (this.cachedConfig) {
      console.log('Returning cached ICE configuration');
      return this.cachedConfig;
    }

    try {
      const url = `${this.envData.HOST}/api/ice-servers`;
      console.log('Fetching ICE servers from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies/credentials if needed
      });

      console.log('ICE server response status:', response.status, response.statusText);

      if (!response.ok) {
        // Log the response text for debugging
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read response body';
        }
        
        const errorMessage = `HTTP ${response.status} ${response.statusText}: ${errorText}`;
        console.error('Failed to fetch ICE servers:', errorMessage);
        throw new Error(errorMessage);
      }

      let config: RTCConfiguration;
      try {
        const responseData = await response.json();
        console.log('Raw response data:', responseData);
        
        // The backend returns { iceServers: [...], iceCandidatePoolSize: 10 }
        // We need to convert it to RTCConfiguration format
        config = {
          iceServers: responseData.iceServers ?? [],
          iceCandidatePoolSize: responseData.iceCandidatePoolSize ?? 10
        };
      } catch (parseError) {
        const message = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        console.error('Failed to parse ICE server response:', message);
        throw new Error(`Failed to parse ICE servers response: ${message}`);
      }

      if (!config.iceServers || !Array.isArray(config.iceServers)) {
        throw new Error('Invalid ICE servers configuration: iceServers is not an array');
      }

      this.cachedConfig = config;
      console.log('ICE configuration loaded successfully:', config.iceServers.length, 'server(s)');
      return config;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Failed to fetch ICE config from server, using STUN-only fallback:', errorMessage);
      console.warn('This is expected if the backend is unreachable. You can still use the application with STUN servers only.');
      return STUN_ONLY_FALLBACK;
    }
  }
}
