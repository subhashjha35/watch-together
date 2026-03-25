# Backend API - Watch Together

Real-time WebRTC video conferencing backend built with **NestJS**, **Socket.IO**, and **TypeScript**.

## Quick Start

### Installation
```bash
yarn install
```

### Development
```bash
npx nx serve api --configuration development
```

### Build
```bash
npx nx build api
```

### Production Start
```bash
node dist/apps/backend-api/main.js
```

---

## Environment Configuration

Create a `.local.env` file in the project root:

```env
# Server
PORT=3000
IP=0.0.0.0
USE_HTTPS=false
CORS_ORIGIN=*

# WebRTC ICE Servers (optional)
ICE_SERVERS=[{"urls":["stun:stun.l.google.com:19302"]}]

# Metered TURN API (optional)
METERED_API_KEY=your_api_key
METERED_APP_NAME=your_app_name
```

---

## API Endpoints

### GET /api/ice-servers
Returns available ICE servers for WebRTC peer connection establishment.

**Response:**
```json
{
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    }
  ],
  "iceCandidatePoolSize": 10
}
```

---

## WebSocket Events

### Room Management
```typescript
// Join room
socket.emit('room', { event: 'join', roomId: 'room-123' });

// Leave room
socket.emit('room', { event: 'leave' });

// Receive: List of peers in room
socket.on('room', (data) => {
  if (data.event === 'peers') {
    console.log('Existing peers:', data.peers);
  }
});
```

### WebRTC Signaling
```typescript
// Offer
socket.emit('call', {
  event: 'offer',
  data: sessionDescription,
  roomId: 'room-123'
});

// Answer
socket.emit('call', {
  event: 'answer',
  data: sessionDescription,
  roomId: 'room-123',
  targetSocketId: 'peer-socket-id'
});

// ICE Candidate
socket.emit('call', {
  event: 'candidate',
  data: iceCandidate,
  roomId: 'room-123'
});

// Receive calls
socket.on('call', (data) => {
  console.log('Received event:', data.event);
  console.log('From:', data.socketId);
  console.log('Payload:', data.data);
});
```

### Video Playback Sync
```typescript
// Notify peers of time position
socket.emit('video', {
  event: 'play',
  time: 42.5  // seconds
});

socket.on('video', (data) => {
  console.log('Video sync:', data.time);
});
```

### Chat
```typescript
// Send message
socket.emit('chat', {
  user: 'username',
  text: 'Hello, everyone!'
});

// Receive message
socket.on('chat', (message) => {
  console.log(`${message.user}: ${message.text}`);
});
```

---

## Architecture

### Modular Design

```
AppModule
├── ConfigModule
│   └── ServerConfigService
├── SocketModule
│   ├── SocketGateway (WebSocket entry point)
│   ├── RoomService (room operations)
│   └── BroadcastService (event distribution)
└── IceServersModule
    ├── IceServersController (REST endpoint)
    └── IceServersService (ICE server logic)
```

### Service Responsibilities

- **SocketGateway**: Receives WebSocket connections and routes events
- **RoomService**: Manages room membership and peer discovery
- **BroadcastService**: Distributes events to peers
- **IceServersService**: Provides ICE/TURN server configuration
- **ServerConfigService**: Centralized configuration management

---

## Development

### Project Structure
```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
├── config/                    # Configuration
├── socket/                    # WebSocket/Socket.IO
├── ice-servers/               # REST API
└── common/                    # Shared utilities
```

### Adding a New Feature

1. Create a feature module:
```typescript
@Module({
  imports: [],
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService]
})
export class MyModule {}
```

2. Import in `AppModule`:
```typescript
@Module({
  imports: [ConfigModule, SocketModule, IceServersModule, MyModule]
})
export class AppModule {}
```

### Creating a Service

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something');
  }
}
```

### Creating a Controller

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('api/my-endpoint')
export class MyController {
  constructor(private readonly myService: MyService) {}

  @Get()
  getMyData() {
    return this.myService.doSomething();
  }
}
```

---

## Testing

### Unit Tests
```bash
npx nx test api
```

### E2E Tests
```bash
npx nx e2e api-e2e
```

---

## Logging

The application uses NestJS built-in logger:

```typescript
private readonly logger = new Logger(ServiceName.name);

this.logger.log('Info message');
this.logger.warn('Warning message');
this.logger.error('Error message', errorObject);
this.logger.debug('Debug message');
```

---

## Error Handling

All errors are caught and logged:

```typescript
try {
  await operation();
} catch (error) {
  this.logger.error('Operation failed', error);
  throw new InternalServerErrorException('User message');
}
```

---

## Performance Tips

1. **Connection Pooling**: Reuse database connections
2. **Caching**: Cache ICE server responses
3. **Message Batching**: Group related socket events
4. **Resource Limits**: Set max peers per room
5. **Monitoring**: Track connection metrics

---

## Production Deployment

### Docker

See `Dockerfile` in this directory.

```bash
docker build -t watch-together-api .
docker run -p 3000:3000 watch-together-api
```

### Environment Variables
Set these before running:
- `PORT`: Server port (default: 3000)
- `IP`: Bind address (default: 0.0.0.0)
- `CORS_ORIGIN`: Allowed origin (default: *)
- `USE_HTTPS`: Enable HTTPS (default: false)
- `METERED_API_KEY`: TURN credentials API key

### SSL/TLS

To use HTTPS:
1. Place `key.pem` and `cert.pem` in `certs/` directory
2. Set `USE_HTTPS=true`

---

## Common Issues

### Issue: WebSocket connection refused
**Check:**
- Server is running on correct port
- Client is connecting to correct URL
- CORS_ORIGIN matches client origin

### Issue: Peers cannot see each other
**Check:**
- Both sockets joined same room
- Socket.IO events are properly emitted
- No firewall blocking connections

### Issue: TURN servers not working
**Check:**
- Metered API key is valid
- Network allows access to turn servers
- ICE servers configuration is correct

---

## Monitoring

### Logs
```bash
# View real-time logs
npx nx serve api

# View build logs
npx nx build api --verbose
```

### Health Check
The application logs on startup:
```
✓ Server is running on http://0.0.0.0:3000
✓ CORS Origin: *
✓ WebSocket Server: Ready
```

---

## Security Considerations

- ✅ CORS configuration: Restrict origins as needed
- ✅ Input validation: Validate all incoming data
- ✅ SSL/TLS: Use HTTPS in production
- ✅ Rate limiting: Implement on critical endpoints
- ✅ Authentication: Add JWT or OAuth2
- ✅ Logging: Monitor for suspicious activity

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Socket.IO Guide](https://socket.io/docs/)
- [WebRTC Samples](https://github.com/webrtc/samples)
- [TURN Servers Guide](https://webrtc.org/getting-started/turn-server)

---

## License

MIT
