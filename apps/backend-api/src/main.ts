import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { bootstrapBackendApplication } from '@watch-together/backend-server';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

bootstrapBackendApplication(AppModule).catch((error: unknown) => {
  logger.error(
    '✗ Failed to start server:',
    error instanceof Error ? (error.stack ?? error.message) : String(error)
  );
  process.exit(1);
});
