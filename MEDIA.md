# Media

Every component page expects a GIF at `public/media/<slug>.gif` (see
`src/data/components.json` → `mediaSlug` for the exact slug per component,
or just run `pnpm run extract` and check the output). If the file is
missing, the page falls back to a "GIF not recorded yet" placeholder — the
site never breaks, it just says so.

## Recording one

1. Run the reference app: `pnpm --filter example ios` (or `android`) from
   `only-react-native-components` — GIFs are recorded from the sibling repo's
   `apps/example`, not from anything in this repo.
2. Navigate to the section that demos the component you're recording.
3. From this repo, run:

   ```sh
   scripts/record.sh <slug>
   ```

   This records ~4s from the booted iOS Simulator, converts to an optimized
   GIF (12fps, 320px wide, shared palette) and writes it to
   `public/media/<slug>.gif`. Target: under 500KB per file.

## Slug ↔ screen map

| Slug | Component | Screen in apps/example |
|---|---|---|
| button | Button | Atoms section, index screen |
| input | Input | Atoms section, index screen |
| modal | Modal | Organisms section — tap "Open modal" |
| bottom-sheet | BottomSheet | Organisms section — tap "Open sheet" |
| select | Select | Organisms section — tap the dropdown |
| alert | Alert | Organisms section — tap "Delete invoice" |
| ... | ... | all others live inline in the scroll, no interaction needed |

Keep this table in sync when a demo's interaction changes — it's the only
thing that tells a future recording session where to point the simulator.

## Known gap

GIFs are **not included in this repo yet**. They don't regenerate
themselves, and recording them needs a booted simulator, which isn't
something that runs in CI or in this environment. Until they're recorded,
every component page shows its code snippet with a placeholder instead of
the GIF. The site works and ships either way — this file just tracks the
debt honestly instead of shipping broken `<img>` tags silently.
