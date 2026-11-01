/**
 * De dónde lee la docs a orn-ui (props, registry, tipos de los demos).
 *
 * Con el repo de la librería al lado (`../orn-ui/packages/ui`, el workspace
 * de desarrollo) usa ESE: la docs documenta lo que está en el repo, incluso
 * lo que todavía no se publicó. Sin él (Vercel, un clon suelto) o con
 * ORN_UI_PUBLISHED=1, usa el paquete instalado desde npm.
 *
 * Ojo: si la docs usa una API que no está publicada, el build en Vercel
 * falla. Publicar la librería antes de desplegar la docs.
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
