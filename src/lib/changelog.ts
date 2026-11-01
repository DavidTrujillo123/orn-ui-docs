import { releases, CHANGE_KIND_ORDER, type ChangeKind } from '../data/changelog';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Solo `code` y **negrita**: lo único que usan las entradas del changelog. */
export function inlineMarkdown(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export function slugifyVersion(version: string): string {
  return `v${version.replace(/\./g, '-')}`;
}

const KIND_LABELS: Record<ChangeKind, string> = {
  breaking: 'Breaking',
  added: 'Added',
  fixed: 'Fixed',
  changed: 'Changed',
};

/** Versión Markdown de ChangelogContent.astro (y lo que un CHANGELOG.md del repo podría espejar). */
export function buildChangelogMarkdown(): string {
  const lines: string[] = [
    '# Changelog — orn-ui',
    '',
    'Every change to the orn-ui package, newest first, grouped by kind and by component.',
    '',
  ];
  for (const r of releases) {
    lines.push(`## ${r.date ? `${r.version} — ${r.date}` : `Unreleased — ${r.version}`}`, '');
    if (r.since) lines.push(`Changes since ${r.since}.`, '');
    lines.push(r.summary, '');
    for (const kind of CHANGE_KIND_ORDER) {
      const groups = r.changes[kind];
      if (!groups?.length) continue;
      lines.push(`### ${KIND_LABELS[kind]}`, '');
      for (const g of groups) {
        lines.push(`- **${g.component}**`);
        for (const item of g.items) lines.push(`  - ${item}`);
      }
      lines.push('');
    }
    if (r.migration?.length) {
      lines.push(`### Migrating from ${r.since ?? 'the previous version'}`, '');
      r.migration.forEach((m, i) => {
        lines.push(`${i + 1}. **${m.title}.** ${m.body}`, '');
        const lang = (code: string) => (code.includes('pnpm ') ? 'bash' : 'tsx');
        if (m.before) lines.push('   Before:', '', '   ```' + lang(m.before), ...m.before.split('\n').map((l) => `   ${l}`), '   ```', '');
        if (m.after) {
          if (m.before) lines.push('   After:', '');
          lines.push('   ```' + lang(m.after), ...m.after.split('\n').map((l) => `   ${l}`), '   ```', '');
        }
      });
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
