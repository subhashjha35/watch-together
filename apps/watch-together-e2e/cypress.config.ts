import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      ciWebServerCommand: 'npx nx run watch-together:serve-static',
      ciBaseUrl: process.env['CYPRESS_BASE_URL'] || 'https://localhost:4200',
    }),
    baseUrl: process.env['CYPRESS_BASE_URL'] || 'https://localhost:4200',
  },
});
