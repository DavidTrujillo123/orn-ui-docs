#!/usr/bin/env node
/**
 * Copia node_modules/orn-ui/registry/*.json a public/r/. Astro publica todo
 * lo que hay bajo public/ tal cual, así que esto convierte al sitio estático
 * en el endpoint que consume el CLI (`orn-ui add button --registry
 * https://orn-ui.dev/r`) sin backend: los mismos archivos que ya usa
 * extract-docs.mjs para la sección "Installation" de cada página, servidos
 * también en crudo para quien no instaló el paquete npm.
 *
 * Corre en `dev` y `build`, antes de `extract` (mismo requisito: necesita
 * "pnpm install" hecho, orn-ui genera registry/ en su script prepare/build).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT, 'node_modules/orn-ui/registry');
const OUT_DIR = path.resolve(ROOT, 'public/r');

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(
      `[sync-registry] no encontré ${SRC_DIR}. Corré "pnpm install" primero ` +
        `(orn-ui genera registry/ en su script "prepare"/"build").`
    );
    process.exit(1);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    fs.copyFileSync(path.join(SRC_DIR, file), path.join(OUT_DIR, file));
  }

  console.log(`[sync-registry] ${files.length} archivos -> public/r/`);
}

main();
