#!/usr/bin/env node
/**
 * Typecheck de demos/ contra el mismo orn-ui que usa el resto de la docs
 * (ver orn-ui-path.mjs): con el repo hermano, sus tipos compilados
 * (lib/typescript, `pnpm --filter orn-ui build`); si no, el paquete de npm.
 */
import { spawnSync } from 'node:child_process';
import { ORN_UI_IS_LOCAL } from './orn-ui-path.mjs';

const project = ORN_UI_IS_LOCAL ? 'tsconfig.demos.local.json' : 'tsconfig.demos.json';
console.log(`[typecheck-demos] ${project}`);
const r = spawnSync('tsc', ['--noEmit', '-p', project], { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(r.status ?? 1);
