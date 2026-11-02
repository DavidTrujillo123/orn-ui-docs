// Source files with more than one documented export that do NOT have an
// individual page: they live together on a group page. Check it in
// getStaticPaths and anywhere that builds a link to a component, so as not
// to generate or link routes that don't exist.
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

// registryDependencies comes from orn-ui's registry, which doesn't know this
// docs site merged pages: Modal and DateField declare a dependency on "title".
// Redirects those slugs to the group's destination.
export const GROUP_SLUG_REDIRECTS: Record<string, { href: string; label: string }> = {
  title: { href: '/typography', label: 'Typography' },
};
