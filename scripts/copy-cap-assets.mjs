import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const repoRoot = resolve(projectRoot, '..');
const sourceDir = resolve(projectRoot, 'src');
const targetDir = resolve(repoRoot, 'TuClosetVirtual', 'wwwroot', 'cap');
const files = ['native-bridge.js', 'tab-bar.js', 'animations.js', 'native.css'];

await mkdir(targetDir, { recursive: true });

await Promise.all(files.map((file) => copyFile(resolve(sourceDir, file), resolve(targetDir, file))));

console.log(`Copied ${files.length} native assets to ${targetDir}`);
