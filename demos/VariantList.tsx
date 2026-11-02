import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption, useColors } from 'orn-ui';

export interface VariantDef {
  label: string;
  content: React.ReactNode;
}

export interface VariantListProps {
  variants: VariantDef[];
  /**
   * Only the first variant is shown, taking all the available height.
   * For demos that bring their own virtualized list (List/SearchList): several
   * can't be stacked in a scroll without nesting VirtualizedLists.
   */
  fill?: boolean;
}

/**
 * VariantList
 * All variants stacked vertically, each one labeled and on its own stage.
 * It replaced a pill selector: with tabs on top you had to scroll back up to
 * change variant, and you couldn't compare two at a glance — which is
 * precisely what a catalog is looked at for.
 */
export function VariantList({ variants, fill = false }: VariantListProps) {
  const colors = useColors();

  if (fill) {
    const only = variants[0];
    return (
      <View style={styles.fillRoot}>
        {!!only && (
          <>
            <Caption style={styles.label}>{only.label}</Caption>
            <View style={[styles.stage, styles.stageFill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {only.content}
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {variants.map((v) => (
        <View key={v.label} style={styles.item}>
          <Caption style={styles.label}>{v.label}</Caption>
          <View style={[styles.stage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {v.content}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Row of small examples side by side within the same `content`. */
export function VariantRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 24 },
  item: { gap: 8 },
  fillRoot: { flex: 1, paddingHorizontal: 20, gap: 8 },
  label: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  stage: { borderRadius: 16, borderWidth: 1, padding: 20, justifyContent: 'center' },
  stageFill: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
});
