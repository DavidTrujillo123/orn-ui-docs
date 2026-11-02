/**
 * Where the docs read orn-ui from (props, registry, demo types).
 *
 * With the library repo alongside (`../orn-ui/packages/ui`, the development
 * workspace) it uses THAT one: the docs document what's in the repo, even
 * what hasn't been published yet. Without it (Vercel, a standalone clone) or
 * with ORN_UI_PUBLISHED=1, it uses the package installed from npm.
 *
 * Careful: if the docs use an API that isn't published, the build on Vercel
 * fails. Publish the library before deploying the docs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = path.resolve(ROOT, '../orn-ui/packages/ui');
const INSTALLED = path.resolve(ROOT, 'node_modules/orn-ui');

export const ORN_UI_DIR =
  process.env.ORN_UI_PUBLISHED !== '1' && fs.existsSync(path.join(LOCAL, 'package.json')) ? LOCAL : INSTALLED;

export const ORN_UI_IS_LOCAL = ORN_UI_DIR === LOCAL;
