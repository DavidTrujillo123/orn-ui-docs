#!/usr/bin/env node
/**
 * Typechecks demos/ against the same orn-ui the rest of the docs uses
 * (see orn-ui-path.mjs): with the sibling repo, its compiled types
 * (lib/typescript, `pnpm --filter orn-ui build`); otherwise, the npm package.
 */
import { spawnSync } from 'node:child_process';
import { ORN_UI_IS_LOCAL } from './orn-ui-path.mjs';

const project = ORN_UI_IS_LOCAL ? 'tsconfig.demos.local.json' : 'tsconfig.demos.json';
console.log(`[typecheck-demos] ${project}`);
const r = spawnSync('tsc', ['--noEmit', '-p', project], { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(r.status ?? 1);
