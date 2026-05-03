import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const repoRoot = resolve(projectRoot, '..');
const logoPath = resolve(repoRoot, 'TuClosetVirtual', 'wwwroot', 'vmoda', 'vmoda logo.png');
const assetsDir = resolve(projectRoot, 'assets');

await mkdir(assetsDir, { recursive: true });

const logoIcon = await sharp(logoPath)
  .resize(760, 760, { fit: 'inside', withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: '#ffffff',
  },
})
  .composite([{ input: logoIcon, gravity: 'center' }])
  .png()
  .toFile(resolve(assetsDir, 'icon.png'));

const logoSplash = await sharp(logoPath)
  .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: '#ffffff',
  },
})
  .composite([{ input: logoSplash, gravity: 'center' }])
  .png()
  .toFile(resolve(assetsDir, 'splash.png'));

console.log(`Generated ${resolve(assetsDir, 'icon.png')} and ${resolve(assetsDir, 'splash.png')}`);
