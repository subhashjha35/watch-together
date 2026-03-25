export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface ServerConfig {
  port: number;
  ip: string;
  useHttps: boolean;
  corsOrigin: string | string[];
  baseDir: string;
  iceServers: IceServer[];
  meteredApiKey: string | undefined;
  meteredAppName: string | undefined;
}
