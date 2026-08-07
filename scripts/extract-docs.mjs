#!/usr/bin/env node
/**
 * Extractor de documentación para orn-ui-docs.
 *
 * 1. Corre react-docgen-typescript sobre node_modules/orn-ui/src (el paquete
 *    publica su código fuente en `files`, no solo el build) para sacar
 *    tablas de props reales. Lee de node_modules, no de una ruta relativa al
 *    repo hermano: así el extractor funciona igual con `file:` link local o
 *    con la versión publicada en npm — no le importa cómo se resolvió la
 *    dependencia.
 * 2. Lee demos/*.demo.tsx (propios de este repo, tipados contra el mismo
 *    orn-ui vía tsconfig.demos.json) y extrae el bloque entre
 *    `// #region demo` y `// #endregion demo` como snippet: el snippet que
 *    se muestra es código que además se typecheckea en el build
 *    (`pnpm run typecheck:demos`), no prosa desconectada del código real.
 * 3. Exporta los tokens numéricos a tokens.json para la página de tokens.
 *
 * Salida: src/data/components.json, src/data/tokens.json
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import * as docgen from 'react-docgen-typescript';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UI_SRC = path.resolve(ROOT, 'node_modules/orn-ui/src');
const REGISTRY_DIR = path.resolve(ROOT, 'node_modules/orn-ui/registry');
const DEMOS_DIR = path.resolve(ROOT, 'demos');
const OUT_DIR = path.resolve(ROOT, 'src/data');

const CATEGORIES = {
  atoms: 'Atom',
  molecules: 'Molecule',
  organisms: 'Organism',
};

// Qué exports PRIMARIOS del barrel de orn-ui tienen página propia en el
// sitio, y en qué orden. category/file ya NO se duplican a mano acá: se
// leen de registry/manifest.json (generado por orn-ui desde sus propios
// barrels, ver packages/ui/scripts/lib/components.mjs) — así esta lista no
// puede desincronizarse de qué archivo respalda a qué componente. Lo único
// que sigue siendo una decisión editorial de este repo es CUÁLES exports
// entran (p.ej. AlertProvider/ToastProvider no tienen demo propio, se
// documentan a través de Alert/Toast) y las excepciones de demo compartido.
const DOC_PAGES = [
  'Title', 'Button', 'IconButton', 'Input', 'Checkbox', 'Badge', 'Card', 'Divider',
  'Avatar', 'Image', 'Spinner', 'EmptyState', 'KeyValueRow', 'Fab', 'PressableScale',
  'Stepper', 'OptionCard', 'InfoRow', 'FormActions', 'AvatarHeader', 'ThemeToggle', 'Steps',
  'Modal', 'BottomSheet', 'Select', 'Alert', 'Screen', 'List', 'SearchList', 'Toast',
  'DatePicker', 'DateField', 'Wizard',
];

// DateField y DatePicker son archivos de FUENTE distintos pero comparten un
// solo demo (demos/DatePicker.demo.tsx) con variants para ambos, filtradas
// por tag JSX en filterVariantsForComponent(). Esto es una decisión de
// contenido de este repo, no algo que el registry de orn-ui pueda derivar.
const DEMO_FILE_OVERRIDES = { DateField: 'DatePicker' };

/**
 * Reconstruye la forma [name, category, file, demoFileOverride?] que el
 * resto del script espera, a partir de registry/manifest.json + DOC_PAGES.
 * Expande además los "siblings" PascalCase de un mismo archivo (Title ->
 * Subtitle/Body/Caption, las 4 variantes de Text.tsx) como páginas propias;
 * siblings que son hooks o constantes (useAlert, DEFAULT_MONTH_NAMES, ...)
 * se descartan — no son "componentes" documentables.
 */
function buildComponentList() {
  const manifestPath = path.join(REGISTRY_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(
      `[extract-docs] no encontré ${manifestPath}. Corré "pnpm install" (orn-ui genera` +
        ` registry/ en su script "prepare"/"build") antes de extraer la doc.`
    );
    process.exit(1);
  }
  const { components } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const byPrimary = new Map(components.map((c) => [c.name, c]));
  const isDocumentableName = (name) => /^[A-Z][a-zA-Z0-9]*$/.test(name);

  const list = [];
  for (const primary of DOC_PAGES) {
    const c = byPrimary.get(primary);
    if (!c) {
      console.warn(`[extract-docs] "${primary}" está en DOC_PAGES pero no existe en registry/manifest.json.`);
      continue;
    }
    const fileBase = path.basename(c.file, path.extname(c.file));
    const override = DEMO_FILE_OVERRIDES[primary] ?? (fileBase !== primary ? fileBase : undefined);
    list.push([primary, c.category, `${fileBase}.tsx`, override]);
    for (const sibling of c.siblingNames) {
      if (!isDocumentableName(sibling)) continue;
      list.push([sibling, c.category, `${fileBase}.tsx`, override ?? fileBase]);
    }
  }
  return list;
}

const COMPONENTS = buildComponentList();

/** registry/<slug>.json ya calculado por orn-ui: deps + tamaño del cierre
 * transitivo, para la sección "Installation" de cada página de componente. */
function loadRegistryEntry(slug) {
  const entryPath = path.join(REGISTRY_DIR, `${slug}.json`);
  if (!fs.existsSync(entryPath)) return null;
  const entry = JSON.parse(fs.readFileSync(entryPath, 'utf8'));
  return {
    registryDependencies: entry.registryDependencies ?? [],
    bytes: entry.files.reduce((sum, f) => sum + Buffer.byteLength(f.content), 0),
  };
}

const parserOptions = {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  // Mantiene solo props declaradas en orn-ui/src (nuestras interfaces),
  // descarta las heredadas de ViewProps/TextProps/etc de React Native.
  // orn-ui vive DENTRO de node_modules (paquete instalado vía file: link),
  // así que filtrar por "no node_modules" —como hacen la mayoría de los
  // ejemplos de react-docgen-typescript— excluiría todo, no solo lo ajeno.
  // `parent.fileName` viene relativo (a veces a cwd, a veces a su padre),
  // así que se compara por substring en vez de path absoluto.
  propFilter: (prop) => !prop.parent || prop.parent.fileName.includes('orn-ui/src/'),
};

/**
 * Fallback: lee la interfaz `<Componente>Props` directamente del AST de
 * TypeScript.
 *
 * react-docgen-typescript detecta componentes por heurística y en algún
 * archivo devuelve cero props aunque la interfaz esté ahí (le pasa con
 * DatePicker). Antes que dejar una tabla vacía en la doc —o peor, escribirla
 * a mano y que se desincronice— se lee la interfaz real. Es sintáctico (sin
 * type checker), suficiente para nombre, opcionalidad, tipo y JSDoc.
 */
function extractPropsFromInterface(filePath, componentName) {
  const source = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const wanted = `${componentName}Props`;
  let members = null;
  source.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === wanted) members = node.members;
  });
  if (!members) return [];

  return members.filter(ts.isPropertySignature).map((m) => {
    const docs = ts.getJSDocCommentsAndTags(m);
    const comment = docs
      .map((d) => (typeof d.comment === 'string' ? d.comment : ''))
      .join(' ')
      .trim();
    const defaultTag = ts
      .getJSDocTags(m)
      .find((t) => t.tagName.text === 'default');
    return {
      name: m.name.getText(source),
      type: m.type ? m.type.getText(source) : 'unknown',
      required: !m.questionToken,
      defaultValue: defaultTag ? String(defaultTag.comment ?? '').trim() || null : null,
      description: comment,
    };
  });
}

function extractProps(category, file, componentName) {
  const filePath = path.join(UI_SRC, category, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[extract-docs] missing source for ${componentName}: ${filePath}`);
    return [];
  }
  const docs = docgen.parse(filePath, parserOptions);
  const doc = docs.find((d) => d.displayName === componentName) ?? docs[0];
  const props = Object.entries(doc?.props ?? {}).map(([name, prop]) => ({
    name,
    type: prop.type?.name ?? 'unknown',
    required: !!prop.required,
    defaultValue: prop.defaultValue?.value ?? null,
    description: prop.description ?? '',
  }));

  if (props.length > 0) return props;
  return extractPropsFromInterface(filePath, componentName);
}

function dedent(text) {
  const lines = text.replace(/\t/g, '  ').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((l) => l.slice(min))
    .join('\n')
    .trim();
}

/**
 * Recorre `source` desde `start` (que debe apuntar a un carácter de apertura)
 * y devuelve el índice del cierre balanceado. Ignora paréntesis/llaves que
 * aparezcan dentro de strings, template literals o comentarios: un
 * `'}'` dentro de un texto no debe cerrar el objeto.
 */
function matchDelimiter(source, start) {
  const OPEN = { '(': ')', '{': '}', '[': ']' };
  const stack = [OPEN[source[start]]];
  let i = start + 1;

  while (i < source.length && stack.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === '/' && next === '/') {
      i = source.indexOf('\n', i);
      if (i === -1) break;
      continue;
    }
    if (ch === '/' && next === '*') {
      i = source.indexOf('*/', i + 2) + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < source.length) {
        if (source[i] === '\\') i += 2;
        else if (source[i] === quote) break;
        else i++;
      }
      i++;
      continue;
    }
    if (OPEN[ch]) stack.push(OPEN[ch]);
    else if (ch === stack[stack.length - 1]) stack.pop();
    i++;
  }
  return i - 1;
}

/**
 * A partir de un `<` en `source[start]`, salta el tag JSX completo
 * (nombre + atributos, respetando strings y `{expr}` anidados) y devuelve
 * dónde termina, si es de cierre (`</...>`) y si es autocontenido (`/>`).
 */
function scanJsxTagOpen(source, start) {
  let i = start + 1;
  const closing = source[i] === '/';
  if (closing) i++;
  while (i < source.length && /[A-Za-z0-9_.:-]/.test(source[i])) i++;
  while (i < source.length && source[i] !== '>') {
    if (source[i] === '{') {
      i = matchDelimiter(source, i) + 1;
      continue;
    }
    if (source[i] === "'" || source[i] === '"' || source[i] === '`') {
      const quote = source[i];
      i++;
      while (i < source.length) {
        if (source[i] === '\\') i += 2;
        else if (source[i] === quote) { i++; break; }
        else i++;
      }
      continue;
    }
    i++;
  }
  const selfClosing = source[i - 1] === '/';
  return { end: i, closing, selfClosing };
}

/**
 * Para un `content:` sin paréntesis (JSX de una línea), devuelve dónde
 * termina su expresión: la primera coma a profundidad 0, o el cierre del
 * objeto que lo contiene. Una coma dentro del *texto* de un JSX (p.ej.
 * `<Caption>Caption, used for...</Caption>`) NO cuenta como separador — se
 * rastrea `jsxDepth` aparte para no cortar la expresión ahí.
 */
function findTopLevelEnd(source, start) {
  let depth = 0;
  let jsxDepth = 0;
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '<' && (jsxDepth > 0 || /[A-Za-z/>]/.test(source[i + 1] ?? ''))) {
      const tag = scanJsxTagOpen(source, i);
      if (tag.closing) jsxDepth--;
      else if (!tag.selfClosing) jsxDepth++;
      i = tag.end + 1;
      continue;
    }
    if (jsxDepth > 0) { i++; continue; }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < source.length) {
        if (source[i] === '\\') i += 2;
        else if (source[i] === quote) break;
        else i++;
      }
    } else if (ch === '(' || ch === '{' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === '}') {
      if (depth === 0) return i;
      depth--;
    } else if (ch === ',' && depth === 0) return i;
    i++;
  }
  return source.length;
}

/**
 * Extrae una entrada de código por VARIANTE, no un único snippet por
 * componente. Los demos declaran `const variants: VariantDef[] = [{ label,
 * content }]`, así que cada objeto del array es un ejemplo autónomo con su
 * propio rótulo — que es exactamente lo que la página del componente quiere
 * mostrar al lado de cada bloque de código.
 */
/**
 * Cuando un demo file es compartido entre varios componentes (`demoFileOverride`,
 * p.ej. Text.tsx → Title/Subtitle/Body/Caption, o DatePicker.tsx → DatePicker/
 * DateField), el array `variants` trae ejemplos de TODOS ellos. Sin filtrar,
 * la página de Title termina mostrando también el código de Body y Caption.
 * Se filtra por el tag JSX de apertura del propio componente; si ningún
 * variant matchea (demo usa un alias de import, p.ej. `OrnAlert`), se
 * devuelve la lista sin filtrar en vez de vaciarla.
 */
function filterVariantsForComponent(variants, componentName) {
  const tag = new RegExp(`<${componentName}(?=[\\s/>])`);
  const own = variants.filter((v) => tag.test(v.code));
  return own.length > 0 ? own : variants;
}

function extractVariants(componentName, demoFileOverride) {
  const demoFile = path.join(DEMOS_DIR, `${demoFileOverride ?? componentName}.demo.tsx`);
  if (!fs.existsSync(demoFile)) return { snippet: null, variants: [] };

  const source = fs.readFileSync(demoFile, 'utf8');
  const region = source.match(/\/\/ #region demo\n([\s\S]*?)\/\/ #endregion demo/);
  if (!region) return { snippet: null, variants: [] };
  const snippet = dedent(region[1]);

  // El `[` se busca DESPUÉS del `=`, no después de la palabra "variants":
  // la anotación de tipo `VariantDef[]` trae su propio par de corchetes y es
  // lo primero que aparece, con lo que se leería un array vacío.
  const declIndex = region[1].indexOf('const variants');
  const eqIndex = declIndex === -1 ? -1 : region[1].indexOf('=', declIndex);
  const arrayStart = eqIndex === -1 ? -1 : region[1].indexOf('[', eqIndex);
  if (arrayStart === -1) return { snippet, variants: [] };
  const arrayEnd = matchDelimiter(region[1], arrayStart);
  const arrayBody = region[1].slice(arrayStart + 1, arrayEnd);

  const variants = [];
  let cursor = 0;
  while (cursor < arrayBody.length) {
    const objStart = arrayBody.indexOf('{', cursor);
    if (objStart === -1) break;
    const objEnd = matchDelimiter(arrayBody, objStart);
    const obj = arrayBody.slice(objStart, objEnd + 1);

    const labelMatch = obj.match(/label:\s*(['"`])([\s\S]*?)\1/);
    const contentIndex = obj.indexOf('content:');
    if (labelMatch && contentIndex !== -1) {
      // El valor de `content` puede venir entre paréntesis (JSX multilínea)
      // o suelto (JSX de una línea); en el segundo caso termina en la coma
      // de nivel superior del objeto, o en su cierre.
      const after = obj.slice(contentIndex + 'content:'.length);
      const firstNonSpace = after.search(/\S/);
      const open = contentIndex + 'content:'.length + firstNonSpace;
      let code;
      if (obj[open] === '(') {
        code = obj.slice(open + 1, matchDelimiter(obj, open));
      } else {
        code = obj.slice(open, findTopLevelEnd(obj, open));
      }
      variants.push({ label: labelMatch[2], code: dedent(code) });
    }
    cursor = objEnd + 1;
  }

  return {
    snippet,
    variants: filterVariantsForComponent(variants, componentName),
    // Lista SIN filtrar (todas las variantes del demo file compartido, no
    // solo las del propio componentName) — la usan las páginas de grupo
    // (p.ej. /typography) que muestran los siblings de un mismo archivo
    // fuente juntos, en vez de repetirla filtrada por cada página
    // individual. Ver buildComponents().
    groupVariants: variants,
  };
}

function buildComponents() {
  const byCategory = { atoms: [], molecules: [], organisms: [] };
  for (const [name, category, file, demoFileOverride] of COMPONENTS) {
    const props = extractProps(category, file, name);
    const { snippet, variants, groupVariants } = extractVariants(name, demoFileOverride);
    const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    byCategory[category].push({
      name,
      category: CATEGORIES[category],
      slug,
      props,
      snippet,
      variants,
      groupVariants,
      mediaSlug: slug,
      registry: loadRegistryEntry(slug),
      // Archivo fuente sin extensión (p.ej. "Text" para Title/Subtitle/Body/
      // Caption). Permite agrupar en la grilla de home los "siblings" que
      // Astro expande como páginas propias pero son, en los hechos, un solo
      // componente con variantes de texto — ver HomeContent.astro.
      sourceFile: path.basename(file, path.extname(file)),
    });
  }
  return byCategory;
}

function buildTokens() {
  const tokensFile = path.join(UI_SRC, 'theme/tokens.ts');
  if (!fs.existsSync(tokensFile)) return {};
  const src = fs.readFileSync(tokensFile, 'utf8');
  const grab = (name) => {
    const re = new RegExp(`export const ${name}[^{]*=\\s*{([\\s\\S]*?)^};`, 'm');
    const m = src.match(re);
    if (!m) return null;
    const entries = [...m[1].matchAll(/(\w+):\s*([^,\n]+),?/g)];
    return Object.fromEntries(entries.map(([, k, v]) => [k, v.trim().replace(/^['"]|['"]$/g, '')]));
  };
  return {
    spacing: grab('spacing'),
    radius: grab('radius'),
    fontSize: grab('fontSize'),
    fontWeight: grab('fontWeight'),
    duration: grab('duration'),
  };
}

function main() {
  if (!fs.existsSync(UI_SRC)) {
    console.error(
      `[extract-docs] orn-ui source not found at ${UI_SRC}. Run "pnpm install" first ` +
        `(package.json depends on it via file:../only-react-native-components/packages/ui).`
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const components = buildComponents();
  fs.writeFileSync(path.join(OUT_DIR, 'components.json'), JSON.stringify(components, null, 2));

  const tokens = buildTokens();
  fs.writeFileSync(path.join(OUT_DIR, 'tokens.json'), JSON.stringify(tokens, null, 2));

  const total = Object.values(components).flat().length;
  const withSnippet = Object.values(components).flat().filter((c) => c.snippet).length;
  console.log(`[extract-docs] ${total} components indexed, ${withSnippet} with a demo snippet.`);
}

main();
