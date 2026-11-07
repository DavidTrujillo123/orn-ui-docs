#!/usr/bin/env node
/**
 * Generates src/data/components.json and tokens.json.
 *
 * Props: react-docgen-typescript over orn-ui/src. Where orn-ui comes from (the
 * sibling repo or the npm package) is decided by scripts/orn-ui-path.mjs.
 *
 * Snippets: the block between `// #region demo` and `// #endregion demo` of
 * each demos/*.demo.tsx, which is also typechecked in the build.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import * as docgen from 'react-docgen-typescript';
import ts from 'typescript';
import { ORN_UI_DIR, ORN_UI_IS_LOCAL } from './orn-ui-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UI_SRC = path.resolve(ORN_UI_DIR, 'src');
const REGISTRY_DIR = path.resolve(ORN_UI_DIR, 'registry');
console.log(`[extract-docs] orn-ui from ${ORN_UI_IS_LOCAL ? 'the local repo' : 'npm'}: ${ORN_UI_DIR}`);
const DEMOS_DIR = path.resolve(ROOT, 'demos');
const OUT_DIR = path.resolve(ROOT, 'src/data');
const UNKNOWN_TAGS = [];

const CATEGORIES = {
  atoms: 'Atom',
  molecules: 'Molecule',
  organisms: 'Organism',
};

// Which exports get their own page and in what order. category/file come from
// registry/manifest.json; here we only decide WHICH ones go in (AlertProvider
// and ToastProvider, for example, are documented inside Alert/Toast).
const DOC_PAGES = [
  'Title', 'Button', 'IconButton', 'Input', 'Checkbox', 'Badge', 'Card', 'Divider',
  'Avatar', 'Image', 'Gradient', 'Spinner', 'Skeleton', 'Transition', 'ShinyText', 'EmptyState', 'KeyValueRow', 'Fab', 'PressableScale',
  'Stepper', 'OptionCard', 'InfoRow', 'FormActions', 'AvatarHeader', 'SegmentedControl', 'ThemeToggle', 'Steps', 'SymmetricGrid',
  'Modal', 'BottomSheet', 'Select', 'OptionWheel', 'Timeline', 'Alert', 'Screen', 'List', 'SearchList', 'Toast',
  'DatePicker', 'DateField', 'Wizard', 'NavigationBar', 'ReorderableList', 'Slides', 'Chart',
];

// Different source files that share the same demo. The variants are split
// by JSX tag in filterVariantsForComponent().
const DEMO_FILE_OVERRIDES = { DateField: 'DatePicker' };

// The clip is recorded per demo, not per export: several exports share a
// screen and therefore share media. Title/Subtitle/Body/Caption are the same
// page (/typography), and DateField is shown inside DatePicker's demo
// (see DEMO_FILE_OVERRIDES) — without this they kept asking for a file no
// flow records, and showed the "not recorded yet" placeholder.
const MEDIA_SLUG_OVERRIDES = {
  Title: 'typography',
  Subtitle: 'typography',
  Body: 'typography',
  Caption: 'typography',
  DateField: 'date-picker',
};

/**
 * [name, category, file, demoFileOverride?] from the manifest and
 * DOC_PAGES. Expands the PascalCase siblings of the same file (Text.tsx
 * -> Title/Subtitle/Body/Caption) and drops hooks and constants.
 */
function buildComponentList() {
  const manifestPath = path.join(REGISTRY_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(
      `[extract-docs] ${manifestPath} not found. Run "pnpm install" (orn-ui generates` +
        ` registry/ in its "prepare"/"build" script) before extracting the docs.`
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
      console.warn(`[extract-docs] "${primary}" is in DOC_PAGES but doesn't exist in registry/manifest.json.`);
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

/** Deps and size of the transitive closure, for the "Installation" section. */
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
  // Only own props, without those inherited from ViewProps/TextProps. The
  // usual "no node_modules" filter doesn't work: orn-ui lives inside
  // node_modules and would be excluded too. It's compared by substring
  // because `parent.fileName` arrives as a relative path.
  propFilter: (prop) => !prop.parent || prop.parent.fileName.includes('orn-ui/src/'),
};

/**
 * The defaults come from three sources with different formats: docgen
 * returns them unquoted ("primary"), the destructuring exactly as written
 * ("'primary'"). They're normalized so the Default column doesn't mix styles.
 */
function normalizeDefault(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().replace(/\s+/g, ' ');
  if (!value) return null;
  return value.replace(/^(['"`])(.*)\1$/, '$2') || null;
}

/**
 * docgen resolves literal unions as "enum", which says nothing in the table.
 * The values are shown (`'sm' | 'md' | 'lg'`) unless there are too many
 * —IconName has dozens—: then the alias name wins.
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
 * Real default values, read from the parameter's destructuring:
 *
 *   export const Button = memo(({ variant = 'primary', ... }: ButtonProps) => …)
 *
 * react-docgen-typescript doesn't see them because the whole library wraps
 * the implementation in memo()/forwardRef(), so without this the "Default"
 * column stays empty for almost every prop.
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

  // memo(fn), forwardRef(fn), memo(forwardRef(fn)) and also the pattern
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

    // The library's other pattern: `(props: XProps) => { const { a = 1 } = props; … }`
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
 * Props read from the interface via AST. It's the source of the JSDoc
 * (description and @default) and the full fallback when react-docgen-typescript
 * returns zero props even though the interface exists (happens with DatePicker).
 */
function extractPropsFromInterface(filePath, componentName) {
  const source = parseSource(filePath);

  const wanted = `${componentName}Props`;
  const interfaces = new Map();
  const aliases = new Map();
  source.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node);
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node);
  });

  // `type XProps = Base & (A | B)` (Chart): walk every interface it is built
  // from, plus what they extend. A member of an interface with a literal
  // `type: 'bar'` only applies to that variant; that is recorded so the table
  // can say so.
  const collected = [];
  const visit = (name, variant) => {
    const decl = interfaces.get(name);
    if (decl) {
      const literal = decl.members.find(
        (m) => ts.isPropertySignature(m) && m.name.getText(source) === 'type' && m.type && ts.isLiteralTypeNode(m.type)
      );
      const own = literal ? literal.type.literal.text : variant;
      for (const clause of decl.heritageClauses ?? []) {
        for (const t of clause.types) visit(t.expression.getText(source), own);
      }
      for (const m of decl.members) if (ts.isPropertySignature(m)) collected.push({ m, variant: own });
      return;
    }
    const alias = aliases.get(name);
    if (alias) walkType(alias.type, variant);
  };
  const walkType = (node, variant) => {
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) node.types.forEach((t) => walkType(t, variant));
    else if (ts.isParenthesizedTypeNode(node)) walkType(node.type, variant);
    else if (ts.isTypeReferenceNode(node)) visit(node.typeName.getText(source), variant);
  };
  visit(wanted, undefined);
  if (collected.length === 0) return [];

  // One row per prop name: the first declaration gives type and JSDoc; the
  // variants it appears in are merged. The `type` discriminant becomes one
  // row listing every variant.
  const byName = new Map();
  const variants = [];
  for (const { m, variant } of collected) {
    const name = m.name.getText(source);
    if (variant && !variants.includes(variant)) variants.push(variant);
    const entry = byName.get(name);
    if (entry) {
      if (variant && entry.appliesTo && !entry.appliesTo.includes(variant)) entry.appliesTo.push(variant);
      if (!variant) entry.appliesTo = null;
      if (!entry.m.jsDoc?.length && m.jsDoc?.length) entry.m = m;
      continue;
    }
    byName.set(name, { m, appliesTo: variant ? [variant] : null });
  }
  const members = [...byName.values()];

  return members.map(({ m, appliesTo }) => {
    const isDiscriminant = m.name.getText(source) === 'type' && variants.length > 1;
    const docs = ts.getJSDocCommentsAndTags(m);
    const comment = docs
      .map((d) => (typeof d.comment === 'string' ? d.comment : ''))
      .join(' ')
      .trim();
    const defaultTag = ts
      .getJSDocTags(m)
      .find((t) => t.tagName.text === 'default');
    // `@default true. When false, doesn't take flex:1` — the tag sometimes carries the
    // value and a clarification; the clarification is description, not value.
    const tagText = String(defaultTag?.comment ?? '').trim();
    const [, tagValue = tagText, tagRest = ''] = /^(\S+?)\.\s+(\S[\s\S]*)$/.exec(tagText) ?? [];
    return {
      name: m.name.getText(source),
      type: isDiscriminant ? variants.map((v) => `'${v}'`).join(' | ') : m.type ? m.type.getText(source) : 'unknown',
      required: !m.questionToken,
      defaultValue: normalizeDefault(tagValue),
      description: comment || tagRest.trim(),
      ...(appliesTo && !isDiscriminant && appliesTo.length < variants.length ? { appliesTo } : {}),
    };
  });
}

function extractProps(category, file, componentName) {
  const filePath = path.join(UI_SRC, category, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[extract-docs] missing source for ${componentName}: ${filePath}`);
    return [];
  }
  // The three sources complement each other: docgen gives resolved types, the
  // interface gives the JSDoc and the destructuring gives the defaults. None has them all.
  const fromInterface = new Map(extractPropsFromInterface(filePath, componentName).map((p) => [p.name, p]));
  const defaults = extractDefaultsFromSource(filePath, componentName);

  const docs = docgen.parse(filePath, parserOptions);
  const doc = docs.find((d) => d.displayName === componentName) ?? docs[0];
  const props = Object.entries(doc?.props ?? {}).map(([name, prop]) => ({
    name,
    type: resolveType(prop),
    required: !!prop.required,
    // The destructuring is the real value that runs; the JSDoc, what's declared.
    // docgen goes last: it returns the whole @default tag, prose included.
    defaultValue:
      defaults[name] ?? fromInterface.get(name)?.defaultValue ?? normalizeDefault(prop.defaultValue?.value) ?? null,
    description: prop.description || fromInterface.get(name)?.description || '',
    ...(fromInterface.get(name)?.appliesTo ? { appliesTo: fromInterface.get(name).appliesTo } : {}),
  }));

  // The discriminant first: in a `type`-driven component (Chart) it's what the
  // rest of the table depends on.
  const discriminant = fromInterface.get('type');
  const discriminantFirst = (list) => {
    if (!discriminant?.type?.includes('|')) return list;
    const rest = list.filter((p) => p.name !== 'type');
    const own = list.find((p) => p.name === 'type');
    return [{ ...(own ?? discriminant), type: discriminant.type }, ...rest];
  };
  if (props.length > 0) return discriminantFirst(props);
  return discriminantFirst(
    [...fromInterface.values()].map((prop) => ({
      ...prop,
      defaultValue: prop.defaultValue ?? defaults[prop.name] ?? null,
    }))
  );
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
 * Index of the balanced closer for the delimiter opened at `start`.
 * Ignores those that appear inside strings, templates or comments.
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
 * Starting from a `<` at `source[start]`, skips the whole JSX tag
 * (name + attributes, respecting strings and nested `{expr}`) and returns
 * where it ends, whether it's a closing tag (`</...>`) and whether it's self-closing (`/>`).
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
 * For a `content:` without parentheses (single-line JSX), returns where its
 * expression ends: the first comma at depth 0, or the closer of the object
 * containing it. A comma inside a JSX's *text* (e.g.
 * `<Caption>Caption, used for...</Caption>`) does NOT count as a separator —
 * `jsxDepth` is tracked separately so the expression isn't cut there.
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
 * When a demo file is shared between several components (`demoFileOverride`,
 * e.g. Text.tsx → Title/Subtitle/Body/Caption, or DatePicker.tsx → DatePicker/
 * DateField), the `variants` array carries examples of ALL of them. Without
 * filtering, Title's page ends up also showing Body's and Caption's code.
 * It's filtered by the component's own opening JSX tag; if no variant
 * matches (the demo uses an import alias, e.g. `OrnAlert`), the unfiltered
 * list is returned instead of emptying it.
 */
function filterVariantsForComponent(variants, componentName) {
  const tag = new RegExp(`<${componentName}(?=[\\s/>])`);
  const own = variants.filter((v) => tag.test(v.code));
  return own.length > 0 ? own : variants;
}

/**
 * A variant whose content is just `<Helper />` or `<Helper prop="x" />` (a component defined in
 * the same demo) showed that tag as code: it teaches nothing and, without the
 * component's tag, the filter dropped it. It's replaced by the full helper's
 * code.
 */
function localHelperSource(source, name) {
  const start = source.search(new RegExp(`^function ${name}\\(`, 'm'));
  if (start === -1) return null;
  const paramsEnd = matchDelimiter(source, source.indexOf('(', start));
  const bodyStart = source.indexOf('{', paramsEnd);
  return source.slice(start, matchDelimiter(source, bodyStart) + 1);
}

function localConstSource(source, name) {
  const start = source.search(new RegExp(`^const ${name}\\b`, 'm'));
  if (start === -1) return null;
  // Up to the `;` that closes the statement, skipping brackets and braces.
  let i = source.indexOf('=', start) + 1;
  while (i < source.length && source[i] !== ';') {
    if ('[{('.includes(source[i])) i = matchDelimiter(source, i);
    i++;
  }
  return source.slice(start, i + 1);
}

// `const MONTHS: ChartRow[] = …` counts too: without the type annotation in the
// pattern, a typed constant was never "defined" and got prepended again on
// every pass (Chart showed MONTHS four times, 2026-11-07).
const definedIn = (code) =>
  new Set([...code.matchAll(/function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*(?::[^=]+)?=/g)].map((m) => m[1] || m[2]));

function inlineLocalComponent(source, code) {
  const m = code.trim().match(/^<([A-Z]\w*)(\s[^<>]*)?\/>$/);
  let out = code;
  if (m) {
    const helper = localHelperSource(source, m[1]);
    // With props (`<Toggle preset="fade" />`) the usage matters too: it goes below.
    if (helper) out = m[2]?.trim() ? `${helper}\n\n${code.trim()}` : helper;
  }
  // A demo helper used INSIDE the code (`<Row>`, `<Panel>`) without its
  // definition in view leaves you wondering where it comes from (happened
  // with `Frame` in Fab, 2026-11-02): its definition is prepended.
  for (let guard = 0; guard < 5; guard++) {
    const defined = definedIn(out);
    const missing = [...new Set([...out.matchAll(/<([A-Z]\w*)/g)].map((x) => x[1]))]
      .filter((tag) => !defined.has(tag))
      .map((tag) => localHelperSource(source, tag))
      .filter(Boolean);
    // Same with the demo's constants (`ROWS`, `AUTO_TOGGLE_MS`): without their
    // definition in view you can't tell where they come from (happened with `EMAIL`).
    const constants = [...new Set([...out.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b/g)].map((x) => x[1]))]
      .filter((name) => !defined.has(name))
      .map((name) => localConstSource(source, name))
      .filter(Boolean);
    if (!missing.length && !constants.length) break;
    out = `${[...constants, ...missing].join('\n\n')}\n\n${out}`;
  }
  return out;
}

/**
 * Every JSX tag in the shown code has to come from orn-ui or react-native
 * (imported in the demo) or be defined in the same code. A `<Frame>` or
 * `<VariantRow>` with no visible origin can't be copied or understood: it fails.
 */
function unknownTags(source, code) {
  const allowed = new Set();
  for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"](orn-ui|react-native)['"]/g)) {
    for (const name of m[1].split(',')) allowed.add(name.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop());
  }
  const defined = definedIn(code);
  return [...new Set([...code.matchAll(/<([A-Z]\w*)/g)].map((x) => x[1]))].filter(
    (tag) => !allowed.has(tag) && !defined.has(tag)
  );
}

function extractVariants(componentName, demoFileOverride) {
  const demoFile = path.join(DEMOS_DIR, `${demoFileOverride ?? componentName}.demo.tsx`);
  if (!fs.existsSync(demoFile)) return { snippet: null, variants: [] };

  const source = fs.readFileSync(demoFile, 'utf8');
  const region = source.match(/\/\/ #region demo\n([\s\S]*?)\/\/ #endregion demo/);
  if (!region) return { snippet: null, variants: [] };
  const snippet = dedent(region[1]);

  // The `[` is searched AFTER the `=`, not after the word "variants":
  // the `VariantDef[]` type annotation carries its own pair of brackets and
  // is the first thing to appear, which would read as an empty array.
  const declIndex = region[1].indexOf('const variants');
  const eqIndex = declIndex === -1 ? -1 : region[1].indexOf('=', declIndex);
  const arrayStart = eqIndex === -1 ? -1 : region[1].indexOf('[', eqIndex);
  if (arrayStart === -1) return { snippet, variants: [] };
  const arrayEnd = matchDelimiter(region[1], arrayStart);
  const arrayBody = region[1].slice(arrayStart + 1, arrayEnd);

  const variants = [];
  // Real position in the demo's array (1-based): it's the deep link's `?v=N`
  // and the screenshot's name (`variants/<slug>/<N>-light.jpg`). The per-component
  // filter drops variants, so the page can NOT use the filtered array's
  // index — that misaligned the screenshots (ShinyText, 2026-11-01).
  let position = 0;
  let cursor = 0;
  while (cursor < arrayBody.length) {
    const objStart = arrayBody.indexOf('{', cursor);
    if (objStart === -1) break;
    const objEnd = matchDelimiter(arrayBody, objStart);
    const obj = arrayBody.slice(objStart, objEnd + 1);

    position++;
    const labelMatch = obj.match(/label:\s*(['"`])([\s\S]*?)\1/);
    const contentIndex = obj.indexOf('content:');
    if (labelMatch && contentIndex !== -1) {
      // `content` may come in parentheses (multiline JSX) or bare.
      const after = obj.slice(contentIndex + 'content:'.length);
      const firstNonSpace = after.search(/\S/);
      const open = contentIndex + 'content:'.length + firstNonSpace;
      let code;
      if (obj[open] === '(') {
        code = obj.slice(open + 1, matchDelimiter(obj, open));
      } else {
        code = obj.slice(open, findTopLevelEnd(obj, open));
      }
      const shown = inlineLocalComponent(source, dedent(code));
      const unknown = unknownTags(source, shown);
      if (unknown.length) {
        UNKNOWN_TAGS.push(`${path.basename(demoFile)} — "${labelMatch[2]}": ${unknown.map((t) => `<${t}>`).join(', ')}`);
      }
      variants.push({ label: labelMatch[2], code: shown, index: position });
    }
    cursor = objEnd + 1;
  }

  return {
    snippet,
    variants: filterVariantsForComponent(variants, componentName),
    // Not filtered by component: group pages (/typography) use it to show
    // all of the file's siblings together.
    groupVariants: variants,
  };
}

// `testID` isn't design API: it exists so Maestro can grab the node in the
// E2E tests, and its row in the table always came out empty —- no useful
// type, no default and no description, because there's nothing to describe.
// It's removed from the table and the page mentions it once, as a note, if
// the component forwards it.
const TESTING_PROPS = new Set(['testID']);

function splitTestingProps(props) {
  return {
    props: props.filter((p) => !TESTING_PROPS.has(p.name)),
    forwardsTestID: props.some((p) => p.name === 'testID'),
  };
}

function buildComponents() {
  const byCategory = { atoms: [], molecules: [], organisms: [] };
  for (const [name, category, file, demoFileOverride] of COMPONENTS) {
    const { props, forwardsTestID } = splitTestingProps(extractProps(category, file, name));
    const { snippet, variants, groupVariants } = extractVariants(name, demoFileOverride);
    const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    byCategory[category].push({
      name,
      category: CATEGORIES[category],
      slug,
      props,
      forwardsTestID,
      snippet,
      variants,
      groupVariants,
      mediaSlug: MEDIA_SLUG_OVERRIDES[name] ?? slug,
      registry: loadRegistryEntry(slug),
      // Source file without extension. Lets siblings be grouped in the nav.
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
        `(the package ships its sources in "files", so node_modules/orn-ui/src is what this reads).`
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
  checkVariantMedia(components);
  if (UNKNOWN_TAGS.length) {
    console.error('[extract-docs] the code of these variants uses tags that neither come from orn-ui/react-native nor are defined in view:\n  ' + [...new Set(UNKNOWN_TAGS)].join('\n  '));
    process.exit(1);
  }
}

/**
 * The per-variant screenshots (`public/media/variants/<slug>/<N>-light.jpg`)
 * have to match the demo's variants 1:1: if the demo gained or lost a variant
 * and wasn't recaptured, each card would show another one's image. The build
 * fails instead of publishing crossed examples.
 */
function checkVariantMedia(components) {
  const problems = [];
  for (const c of Object.values(components).flat()) {
    const dir = path.join(ROOT, 'public/media/variants', c.mediaSlug);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const all = c.groupVariants ?? c.variants;
    for (const theme of ['light', 'dark']) {
      const shots = files.filter((f) => f.endsWith(`-${theme}.jpg`)).length;
      if (shots !== all.length) problems.push(`${c.name}: the demo has ${all.length} variants and there are ${shots} ${theme} screenshots`);
    }
    for (const v of c.variants) {
      if (!files.includes(`${v.index}-light.jpg`)) problems.push(`${c.name}: missing the screenshot for variant ${v.index} (${v.label})`);
    }
  }
  if (problems.length) {
    console.error('[extract-docs] screenshots out of sync with the demos — rerun scripts/capture-variants.sh:\n  ' + [...new Set(problems)].join('\n  '));
    process.exit(1);
  }
}

main();
