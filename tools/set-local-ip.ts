// tools/set-local-ip.ts
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// Resolve project root from current working directory to avoid import.meta usage
const projectRoot = process.cwd();

const interfaces = os.networkInterfaces();

// Prefer typical physical interfaces and avoid Docker/VPN/virtual ones.
const preferredIfacesOrder = ['en0', 'en1', 'wlan0', 'eth0', 'Ethernet'];
const excludedIfacePrefixes = [
  'lo', // loopback
  'docker', // docker bridge
  'vboxnet', // virtualbox
  'utun', // macOS VPN/tunnel
  'awdl', // apple wireless direct link
  'llw', // apple low latency wifi
  'br-', // docker custom bridge
  'bridge', // general bridge
  'vmnet', // VMWare
  'tailscale', // tailscale overlay
  'wg', // wireguard
  'tun', // general tun devices
  'tap', // general tap devices
  'podman' // podman networks
];

function isExcludedIface(name: string): boolean {
  return excludedIfacePrefixes.some((p) => name.startsWith(p));
}

function isValidIPv4Address(address: string): boolean {
  // Basic IPv4 check without relying on any external lib
  const parts = address.split('.').map((p) => Number(p));
  return parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
}

function ipCategory(address: string): 'lan-192' | 'lan-10' | 'lan-172' | 'other' {
  if (address.startsWith('192.168.')) return 'lan-192';
  if (address.startsWith('10.')) return 'lan-10';
  const parts = address.split('.').map((p) => Number(p));
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return 'lan-172';
  return 'other';
}

function selectLocalIPv4(): string {
  // Collect candidates grouped by category to prefer home/office LANs first (192.168)
  const candidates: Record<string, string[]> = {
    'lan-192': [],
    'lan-10': [],
    'lan-172': [],
    other: []
  };

  // 1) Add preferred interfaces first
  for (const pref of preferredIfacesOrder) {
    const configs = interfaces[pref];
    if (!configs) continue;
    for (const cfg of configs) {
      if (cfg && cfg.family === 'IPv4' && !cfg.internal && isValidIPv4Address(cfg.address)) {
        candidates[ipCategory(cfg.address)].push(cfg.address);
      }
    }
  }

  // 2) Add any non-excluded interface
  for (const [name, configs] of Object.entries(interfaces)) {
    if (!configs || isExcludedIface(name)) continue;
    for (const cfg of configs) {
      if (cfg && cfg.family === 'IPv4' && !cfg.internal && isValidIPv4Address(cfg.address)) {
        candidates[ipCategory(cfg.address)].push(cfg.address);
      }
    }
  }

  // 3) Return by category preference: 192.168 > 10.* > 172.16-31 > other
  for (const key of ['lan-192', 'lan-10', 'lan-172', 'other'] as const) {
    if (candidates[key].length) return candidates[key][0];
  }

  // 4) Last resort
  return '127.0.0.1';
}

const localIP = selectLocalIPv4();

const envPath = path.resolve(projectRoot, '.local.env');
const envContent = `IP=${localIP}
BACKEND_PORT=3000
FRONTEND_PORT=4200
USE_HTTPS=true
`;

fs.writeFileSync(envPath, envContent);
console.log(`Local IP set to ${localIP} in .local.env`);
