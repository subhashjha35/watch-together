// tools/set-local-ip.ts
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const interfaces = os.networkInterfaces();
let localIP = '127.0.0.1';

for (const iface of Object.values(interfaces)) {
  if (iface) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        localIP = config.address;
        break;
      }
    }
  }
}

const envPath = path.resolve(__dirname, '../.local.env');
const envContent = `IP=${localIP}
BACKEND_PORT=3000
FRONTEND_PORT=4200
`;

fs.writeFileSync(envPath, envContent);
console.log(`Local IP set to ${localIP} in .local.env`);
