// Componentes cuyo `sourceFile` tiene más de un export documentado (hoy:
// Text.tsx → Title/Subtitle/Body/Caption) y por eso NO tienen página
// individual — viven todos juntos en una página de grupo dedicada
// (/typography), con un solo ejemplo combinado y una sola instalación,
// en vez de 4 páginas casi idénticas. Único punto de verdad: úsalo en
// getStaticPaths (para no generar las rutas individuales) y en cualquier
// lugar que arme un link a un componente (para no linkear a una página
// que no existe).
export const GROUP_PAGES: Record<string, string> = {
  Text: '/typography',
};

// Clave de i18n para el label del tile de grupo (nav, sidebar, home grid)
// — "Typography" en vez del nombre crudo del archivo fuente ("Text").
export const GROUP_LABEL_KEYS: Record<string, string> = {
  Text: 'typography.name',
};

export function isMergedIntoGroupPage(component: { sourceFile?: string }): boolean {
  return component.sourceFile != null && component.sourceFile in GROUP_PAGES;
}

export function groupPageFor(sourceFile: string): string | undefined {
  return GROUP_PAGES[sourceFile];
}

// registryDependencies en components.json referencian por SLUG (p.ej.
// Modal y DateField dependen de "title" — el registry de orn-ui no sabe
// que esta doc lo fusionó). Mapeo slug -> destino de grupo, para que esos
// dep-chips linkeen a /typography con label "Typography" en vez de a la
// página individual que ya no existe.
export const GROUP_SLUG_REDIRECTS: Record<string, { href: string; label: string }> = {
  title: { href: '/typography', label: 'Typography' },
};
