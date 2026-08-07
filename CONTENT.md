# Content (the "CMS")

There's no headless CMS, no database, no extra service to pay for or keep
alive. The editorial copy on the homepage (hero title, lede, badges,
install hint, footer) lives in two plain files:

```
src/content/site/en.json
src/content/site/es.json
```

## Editing it

1. Open the file on GitHub (or clone locally) and change the text.
2. Commit to a branch, open a PR (or push straight to `main` if that's
   your workflow) — Vercel builds a preview deployment for every PR
   automatically, so you see the change live before it ships.
3. Merge. Vercel builds `main` and promotes it to production. No manual
   deploy step, no CMS login, no webhook to babysit.

Fields are schema-validated at build time
(`src/content/config.ts`, via Zod). If a field is missing or the wrong
type, **the build fails** — locally and on Vercel — instead of a broken
or empty string shipping to production. That's the whole safety net a
CMS normally gives you, for free, from files you already review in PRs.

## What's NOT here

Everything else on the site — component names, prop tables, code
snippets, variant examples — is generated at build time from
`orn-ui`'s own source (`pnpm run extract`, see `scripts/extract-docs.mjs`).
Editing those means editing `orn-ui` itself or the demo files in
`demos/*.demo.tsx`; hand-editing `src/data/*.json` is pointless, it's
regenerated on every build and dev start.

## Adding a field

1. Add it to the Zod schema in `src/content/config.ts`.
2. Add the value to **both** `en.json` and `es.json` — the schema doesn't
   enforce parity between languages, so a value missing in one locale
   just falls through to `undefined` at render time, no build error.
3. Read it in `src/components/HomeContent.astro` via
   `const entry = await getEntry('site', lang); entry.data.yourField`.
