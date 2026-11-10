import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: root,
  webpack: (config) => {
    config.resolve.alias.phaser = path.join(root, 'node_modules/phaser/dist/phaser.js');
    return config;
  },
};

export default nextConfig;
