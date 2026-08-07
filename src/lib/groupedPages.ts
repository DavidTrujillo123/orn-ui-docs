// Archivos fuente con más de un export documentado que NO tienen página
// individual: viven juntos en una página de grupo. Consultarlo en
// getStaticPaths y en cualquier lugar que arme un link a un componente,
// para no generar ni enlazar rutas que no existen.
export const GROUP_PAGES: Record<string, string> = {
  Text: '/typography',
};

export const GROUP_LABEL_KEYS: Record<string, string> = {
  Text: 'typography.name',
};

export function isMergedIntoGroupPage(component: { sourceFile?: string }): boolean {
  return component.sourceFile != null && component.sourceFile in GROUP_PAGES;
}

export function groupPageFor(sourceFile: string): string | undefined {
  return GROUP_PAGES[sourceFile];
}

// registryDependencies viene del registry de orn-ui, que no sabe que esta
// doc fusionó páginas: Modal y DateField declaran dependencia de "title".
// Redirige esos slugs al destino del grupo.
export const GROUP_SLUG_REDIRECTS: Record<string, { href: string; label: string }> = {
  title: { href: '/typography', label: 'Typography' },
};
