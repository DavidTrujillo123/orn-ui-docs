#!/usr/bin/env node
/**
 * Notifies the search engines that support IndexNow (Bing, Yandex, Seznam,
 * Naver) that the site's pages changed. Google does NOT take part in the
 * protocol: for Google the sitemap in Search Console is still needed.
 *
 * Zero dependencies, like the rest of the scripts: it reads the URLs from the
 * sitemap already built in dist/ and sends them in a single POST.
 *
 *   node scripts/indexnow.mjs           # needs `pnpm build` first
 *   node scripts/indexnow.mjs --dry-run # prints the payload and sends nothing
 *
 * The key lives in public/<KEY>.txt and is published with the site: IndexNow
 * uses it to check that the sender controls the domain. It's public by
 * design — not a secret, just proof of ownership.
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

// @astrojs/sitemap's sitemap comes out without line breaks, so the <loc>s
// are extracted with a regex instead of parsing XML (one more dependency).
function readSitemapUrls() {
  const dir = path.resolve(ROOT, 'dist');
  const files = fs.readdirSync(dir).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (files.length === 0) {
    throw new Error('No dist/sitemap-*.xml. Run `pnpm build` first.');
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
  throw new Error(`URLs outside ${HOST}, IndexNow would reject them: ${bad[0]}`);
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

// 200 = accepted, 202 = accepted but the key isn't validated yet.
const body = await res.text();
console.log(`[indexnow] HTTP ${res.status}${body ? ` — ${body}` : ''}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
