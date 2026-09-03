/**
 * Convierte public/favicon.svg en los PNG que pide el manifiesto de la PWA.
 * Se corre con: npm run iconos
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(join(raiz, 'public', 'favicon.svg'));

for (const lado of [192, 512]) {
  const png = await sharp(svg).resize(lado, lado).png().toBuffer();
  await writeFile(join(raiz, 'public', `icono-${lado}.png`), png);
  console.log(`icono-${lado}.png listo`);
}
