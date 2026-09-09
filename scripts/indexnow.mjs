#!/usr/bin/env node
/**
 * Avisa a los buscadores que soportan IndexNow (Bing, Yandex, Seznam, Naver)
 * de que las páginas del sitio cambiaron. Google NO participa en el protocolo:
 * para Google sigue haciendo falta el sitemap en Search Console.
 *
 * Cero dependencias, igual que el resto de scripts: lee las URLs del
 * sitemap ya construido en dist/ y las manda en un solo POST.
 *
 *   node scripts/indexnow.mjs           # necesita `pnpm build` antes
 *   node scripts/indexnow.mjs --dry-run # imprime el payload y no envía nada
 *
 * La clave vive en public/<KEY>.txt y se publica con el sitio: IndexNow la
 * usa para comprobar que quien envía controla el dominio. Es pública por
 * diseño — no es un secreto, solo prueba de propiedad.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HOST = 'orn-ui-docs.vercel.app';
const KEY = 'df2c7dca57167243870304e9ebe491e3';
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const DRY_RUN = process.argv.includes('--dry-run');

// El sitemap de @astrojs/sitemap sale sin saltos de línea, así que se
// extraen los <loc> con regex en vez de parsear XML (una dependencia más).
function readSitemapUrls() {
  const dir = path.resolve(ROOT, 'dist');
  const files = fs.readdirSync(dir).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (files.length === 0) {
    throw new Error('No hay dist/sitemap-*.xml. Corre `pnpm build` primero.');
  }
  const urls = new Set();
  for (const f of files) {
    const xml = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
  }
  return [...urls];
}

const urlList = readSitemapUrls();
const bad = urlList.filter((u) => !u.startsWith(`https://${HOST}/`));
if (bad.length > 0) {
  throw new Error(`URLs fuera de ${HOST}, IndexNow las rechazaría: ${bad[0]}`);
}

const payload = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList };
console.log(`[indexnow] ${urlList.length} URLs -> ${ENDPOINT}`);

if (DRY_RUN) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

// 200 = aceptado, 202 = aceptado pero la clave aún no está validada.
const body = await res.text();
console.log(`[indexnow] HTTP ${res.status}${body ? ` — ${body}` : ''}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
