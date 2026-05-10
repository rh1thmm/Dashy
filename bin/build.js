#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '../..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  try {
    execSync('node node_modules/.bin/vite build', {
      cwd: root,
      stdio: 'inherit',
    });
  } catch {
    process.exit(1);
  }
}
