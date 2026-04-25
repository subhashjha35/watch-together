import type { IceServer } from '@watch-together/backend-config/common';

export interface IceServersResponse {
    iceServers: IceServer[];
    iceCandidatePoolSize: number;
}
