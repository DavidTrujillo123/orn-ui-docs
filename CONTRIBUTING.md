# Contributing to orn-ui-docs

This repo is the documentation site. The library it documents lives in
[orn-ui](https://github.com/DavidTrujillo123/orn-ui) — if you are adding or
changing a *component*, start there and come back here at the last step; its
[`CONTRIBUTING.md`](https://github.com/DavidTrujillo123/orn-ui/blob/main/CONTRIBUTING.md)
walks the whole path.

## How a component page is built

Almost nothing on a component page is hand-written prose, on purpose: prose
drifts from the code and nobody notices.

| section | comes from |
|---|---|
| props table | `react-docgen-typescript` reading `node_modules/orn-ui/src/**` |
| code snippet | `demos/<Name>.demo.tsx`, between `// #region demo` markers |
| install size and deps | `node_modules/orn-ui/registry/<slug>.json` |
| demo clip | `public/media/<slug>.mp4`, recorded from the library's example app |
| "Usage" bullets | `src/i18n/components/<slug>/{en,es}.json` → `usage` |
| translated prop descriptions | `src/i18n/components/<slug>/{en,es}.json` → `props` |

The only hand-written parts are those last two, and they live together in one
folder per component. The bullets should say what the props table cannot: when
to reach for the component, which prop pairs go together, what the default
protects you from.

```sh
pnpm install
pnpm run dev      # sync:registry + extract + astro dev
pnpm run build    # typecheck:demos + sync:registry + extract + astro build
```

The site installs `orn-ui` **from npm**. A component that is not in a published
version cannot be documented here yet — bump the dependency once it ships.

## Adding a page for a new component

1. **Write the demo** — `demos/<Name>.demo.tsx`. It renders a `VariantDef[]`
   through the local `VariantList`, and the part that becomes the published
   snippet goes between `// #region demo` and `// #endregion demo`. Keep it
   close to the demo in the library's example app: same variants, same labels.
   Both are typechecked, so a snippet that does not compile never ships:

   ```sh
   pnpm run typecheck:demos
   ```

2. **Add it to `DOC_PAGES`** in `scripts/extract-docs.mjs`, in its category.
   The extractor pulls the props, the snippet and the registry entry from
   there.

3. **Write the "Usage" bullets** in `src/i18n/components/<slug>/en.json` and
   `.../es.json`, under `usage`. Both languages: a missing translation falls
   back to English silently, which reads like an oversight because it is one.

   The same two files carry the prop overrides, under `props`. The JSDoc in
   `orn-ui` is written in one language, so the *other* one goes here:

   ```json
   {
     "usage": [{ "term": "when to use", "desc": "..." }],
     "props": {
       "steps": { "description": "Bands per segment.", "default": "24" }
     }
   }
   ```

   `description` replaces the JSDoc text for that language — without it the
   table falls back to the source, which is how a page ends up half in the
   wrong language. `default` is only for the `@default` values that say
   nothing to a reader: prose ("a plain grey placeholder") or a constant name
   (`DEFAULT_STEPS`).

4. **Record the clip** — see [`MEDIA.md`](MEDIA.md). Needs macOS, a booted
   simulator and the library repo checked out as a sibling:

   ```sh
   scripts/record-demo.sh <slug>
   ```

5. **Build and look at it.** `pnpm run build`, then `pnpm exec astro preview`.

Two cases that need one extra line:

- **Several exports sharing one page** (Text.tsx renders as one "Typography"
  entry): they are collapsed by `sourceFile` in `src/lib/navGroups.ts`, and the
  page itself is declared in `src/lib/groupedPages.ts`.
- **An export with no demo of its own** (DateField is demonstrated inside
  DatePicker's demo): point it at the media of the page it lives on via
  `MEDIA_SLUG_OVERRIDES`, or it will ask for a clip no flow records.

## Ordering

Components are alphabetical within atoms / molecules / organisms. The sort
lives in `groupCards` (`src/lib/navGroups.ts`), not in the extractor, for two
reasons: collapsing siblings looks at consecutive items, so sorting earlier
would scatter them; and the key being sorted is the label a reader sees, which
depends on the language. One sort covers the home grid, the sidebar and the
prev/next pager, because all three go through that function.

## Media

Read [`MEDIA.md`](MEDIA.md) before touching anything under `public/media/`. The
short version:

- A page shows `<slug>.mp4` if it exists, and falls back to the `<slug>.jpg`
  poster otherwise. The choice is made at build time by looking at the
  filesystem — there is no flag to keep in sync.
- The clips are recorded by Maestro flows that live in the library repo, so the
  choreography is versioned code and can be regenerated. Do not hand-record a
  screen capture.
- If a component gains nothing from motion, delete its `.mp4` and keep the
  `.jpg`.
- The home grid always uses posters. Forty autoplaying videos is a page that
  weighs tens of megabytes and moves all over.

## Client-side JavaScript

The site is static Astro with no framework runtime in the browser: components
are documented with code plus a recorded clip, not rendered live. That was a
deliberate trade (see the README) and it is worth keeping.

What client JS exists is a handful of inline vanilla scripts in `BaseLayout`.
If you add one, wire it on `astro:page-load`, not at parse time — the site uses
`ClientRouter`, and a client-side navigation does not re-run inline scripts in
the swapped content. A script that only works after a manual reload is the
symptom.

## Before opening a pull request

```sh
pnpm run typecheck:demos
pnpm run build
```

CI (`.github/workflows/ci.yml`) runs exactly those two — on pull requests and
on pushes to `main`. It does not record clips: that needs a booted iOS Simulator, which CI
does not have, so media is committed rather than built.

## Commits

Conventional commits, in English: `feat(docs):`, `fix(ci):`, `feat(media):`.
Explain why a change is shaped the way it is — the reason a video needs a
scripted `play()`, or why the sort lives where it lives, is what stops the next
person from undoing it.
