#!/usr/bin/env node
/**
 * Copies node_modules/orn-ui/registry/*.json to public/r/. Astro publishes
 * everything under public/ as is, so this turns the static site into the
 * endpoint the CLI consumes (`orn-ui add button --registry
 * https://orn-ui.dev/r`) without a backend: the same files extract-docs.mjs
 * already uses for each page's "Installation" section, also served raw for
 * those who didn't install the npm package.
 *
 * Runs in `dev` and `build`, before `extract` (same requirement: it needs
 * "pnpm install" done, orn-ui generates registry/ in its prepare/build script).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORN_UI_DIR } from './orn-ui-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ORN_UI_DIR, 'registry');
const OUT_DIR = path.resolve(ROOT, 'public/r');

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(
      `[sync-registry] ${SRC_DIR} not found. Run "pnpm install" first ` +
        `(orn-ui generates registry/ in its "prepare"/"build" script).`
    );
    process.exit(1);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    fs.copyFileSync(path.join(SRC_DIR, file), path.join(OUT_DIR, file));
  }

  console.log(`[sync-registry] ${files.length} files -> public/r/`);
}

main();
