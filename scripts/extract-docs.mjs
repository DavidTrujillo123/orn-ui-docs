#!/usr/bin/env node
/**
 * Genera src/data/components.json y tokens.json.
 *
 * Props: react-docgen-typescript sobre node_modules/orn-ui/src. Se lee de
 * node_modules y no del repo hermano para que funcione igual con `file:`
 * local o con el paquete publicado.
 *
 * Snippets: el bloque entre `// #region demo` y `// #endregion demo` de
 * cada demos/*.demo.tsx, que además se typecheckea en el build.
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

// Qué exports tienen página propia y en qué orden. category/file salen de
// registry/manifest.json; acá solo se decide CUÁLES entran (AlertProvider y
// ToastProvider, por ejemplo, se documentan dentro de Alert/Toast).
const DOC_PAGES = [
  'Title', 'Button', 'IconButton', 'Input', 'Checkbox', 'Badge', 'Card', 'Divider',
  'Avatar', 'Image', 'Spinner', 'Skeleton', 'Transition', 'EmptyState', 'KeyValueRow', 'Fab', 'PressableScale',
  'Stepper', 'OptionCard', 'InfoRow', 'FormActions', 'AvatarHeader', 'SegmentedControl', 'ThemeToggle', 'Steps',
  'Modal', 'BottomSheet', 'Select', 'Alert', 'Screen', 'List', 'SearchList', 'Toast',
  'DatePicker', 'DateField', 'Wizard', 'NavigationBar',
];

// Archivos fuente distintos que comparten un mismo demo. Las variantes se
// separan por tag JSX en filterVariantsForComponent().
const DEMO_FILE_OVERRIDES = { DateField: 'DatePicker' };

// El gif se graba por página, no por export: los siblings de una página de
// grupo comparten el de la página (Title vive en /typography).
const MEDIA_SLUG_OVERRIDES = { Title: 'typography' };

/**
 * [name, category, file, demoFileOverride?] a partir del manifest y
 * DOC_PAGES. Expande los siblings PascalCase de un mismo archivo (Text.tsx
 * -> Title/Subtitle/Body/Caption) y descarta hooks y constantes.
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

/** Deps y tamaño del cierre transitivo, para la sección "Installation". */
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
  // Solo props propias, sin las heredadas de ViewProps/TextProps. No sirve
  // el filtro habitual por "no node_modules": orn-ui vive dentro de
  // node_modules y quedaría excluido también. Se compara por substring
  // porque `parent.fileName` llega como ruta relativa.
  propFilter: (prop) => !prop.parent || prop.parent.fileName.includes('orn-ui/src/'),
};

/**
 * Los defaults llegan de tres fuentes con formatos distintos: docgen los
 * devuelve sin comillas ("primary"), el destructuring tal cual está escrito
 * ("'primary'"). Se normalizan para que la columna Default no mezcle estilos.
 */
function normalizeDefault(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().replace(/\s+/g, ' ');
  if (!value) return null;
  return value.replace(/^(['"`])(.*)\1$/, '$2') || null;
}

/**
 * docgen resuelve las uniones de literales como "enum", que en la tabla no
 * dice nada. Se muestran los valores (`'sm' | 'md' | 'lg'`) salvo cuando son
 * demasiados —IconName tiene decenas—: ahí gana el nombre del alias.
 */
const MAX_UNION_MEMBERS = 8;

function resolveType(prop) {
  const type = prop.type;
  if (!type) return 'unknown';
  if (type.name !== 'enum' || !Array.isArray(type.value)) return type.name;

  const members = type.value.map((v) => String(v.value).replace(/"/g, "'"));
  if (members.length === 0 || members.length > MAX_UNION_MEMBERS) return type.raw ?? type.name;
  return members.join(' | ');
}

function parseSource(filePath) {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
}

/**
 * Valores por defecto reales, leídos del destructuring del parámetro:
 *
 *   export const Button = memo(({ variant = 'primary', ... }: ButtonProps) => …)
 *
 * react-docgen-typescript no los ve porque toda la librería envuelve la
 * implementación en memo()/forwardRef(), así que sin esto la columna
 * "Default" queda vacía en casi todas las props.
 */
function extractDefaultsFromSource(filePath, componentName) {
  const source = parseSource(filePath);
  const declarations = new Map();
  const candidates = [];

  source.forEachChild((node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          declarations.set(decl.name.text, decl.initializer);
          if (decl.name.text === componentName) candidates.push(decl.initializer);
        }
      }
    } else if (ts.isFunctionDeclaration(node) && node.name?.text === componentName) {
      candidates.push(node);
    }
  });

  // memo(fn), forwardRef(fn), memo(forwardRef(fn)) y también el patrón
  // `const Impl = (…) => …; export const X = memo(Impl)`.
  function unwrap(expr, depth = 0) {
    if (!expr || depth > 4) return null;
    if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr) || ts.isFunctionDeclaration(expr)) return expr;
    if (ts.isCallExpression(expr)) return unwrap(expr.arguments[0], depth + 1);
    if (ts.isIdentifier(expr)) return unwrap(declarations.get(expr.text), depth + 1);
    return null;
  }

  const defaults = {};
  function collect(pattern) {
    for (const element of pattern.elements) {
      if (!element.initializer) continue;
      const key = (element.propertyName ?? element.name).getText(source);
      defaults[key] = normalizeDefault(element.initializer.getText(source));
    }
  }

  for (const candidate of candidates) {
    const fn = unwrap(candidate);
    if (!fn) continue;
    const param = fn.parameters?.[0];
    if (param && ts.isObjectBindingPattern(param.name)) collect(param.name);

    // El otro patrón de la librería: `(props: XProps) => { const { a = 1 } = props; … }`
    const paramName = param && ts.isIdentifier(param.name) ? param.name.text : null;
    if (paramName && fn.body && ts.isBlock(fn.body)) {
      for (const statement of fn.body.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const decl of statement.declarationList.declarations) {
          const initializerIsProps = decl.initializer && ts.isIdentifier(decl.initializer) && decl.initializer.text === paramName;
          if (initializerIsProps && ts.isObjectBindingPattern(decl.name)) collect(decl.name);
        }
      }
    }
  }
  return defaults;
}

/**
 * Props leídas de la interfaz por AST. Es la fuente del JSDoc (descripción y
 * @default) y el fallback completo cuando react-docgen-typescript devuelve
 * cero props pese a existir la interfaz (le pasa con DatePicker).
 */
function extractPropsFromInterface(filePath, componentName) {
  const source = parseSource(filePath);

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
    // `@default true. En false, no ocupa flex:1` — el tag a veces trae el
    // valor y una aclaración; la aclaración es descripción, no valor.
    const tagText = String(defaultTag?.comment ?? '').trim();
    const [, tagValue = tagText, tagRest = ''] = /^(\S+?)\.\s+(\S[\s\S]*)$/.exec(tagText) ?? [];
    return {
      name: m.name.getText(source),
      type: m.type ? m.type.getText(source) : 'unknown',
      required: !m.questionToken,
      defaultValue: normalizeDefault(tagValue),
      description: comment || tagRest.trim(),
    };
  });
}

function extractProps(category, file, componentName) {
  const filePath = path.join(UI_SRC, category, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[extract-docs] missing source for ${componentName}: ${filePath}`);
    return [];
  }
  // Las tres fuentes se complementan: docgen da tipos resueltos, la interfaz
  // da el JSDoc y el destructuring da los defaults. Ninguna las tiene todas.
  const fromInterface = new Map(extractPropsFromInterface(filePath, componentName).map((p) => [p.name, p]));
  const defaults = extractDefaultsFromSource(filePath, componentName);

  const docs = docgen.parse(filePath, parserOptions);
  const doc = docs.find((d) => d.displayName === componentName) ?? docs[0];
  const props = Object.entries(doc?.props ?? {}).map(([name, prop]) => ({
    name,
    type: resolveType(prop),
    required: !!prop.required,
    // El destructuring es el valor real que corre; el JSDoc, lo declarado.
    // docgen va último: devuelve el tag @default entero, prosa incluida.
    defaultValue:
      defaults[name] ?? fromInterface.get(name)?.defaultValue ?? normalizeDefault(prop.defaultValue?.value) ?? null,
    description: prop.description || fromInterface.get(name)?.description || '',
  }));

  if (props.length > 0) return props;
  return [...fromInterface.values()].map((prop) => ({
    ...prop,
    defaultValue: prop.defaultValue ?? defaults[prop.name] ?? null,
  }));
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
 * Índice del cierre balanceado para el delimitador abierto en `start`.
 * Ignora los que aparecen dentro de strings, templates o comentarios.
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
      // `content` puede venir entre paréntesis (JSX multilínea) o suelto.
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
    // Sin filtrar por componente: la usan las páginas de grupo (/typography)
    // para mostrar juntos todos los siblings del archivo.
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
      mediaSlug: MEDIA_SLUG_OVERRIDES[name] ?? slug,
      registry: loadRegistryEntry(slug),
      // Archivo fuente sin extensión. Permite agrupar siblings en la nav.
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
