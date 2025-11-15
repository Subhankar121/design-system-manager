import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetDir = join(__dirname, '../public');
const targetFile = join(targetDir, 'reset-flag.json');

await mkdir(targetDir, { recursive: true });

const payload = {
  lastReset: Date.now(),
};

await writeFile(targetFile, JSON.stringify(payload, null, 2));

console.log('Reset flag updated. Reload the app to re-seed localStorage data.');

