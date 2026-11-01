import React from 'react';
import { View } from 'react-native';
import { Caption, IconButton, useColors, type IconName } from 'orn-ui';

// orn-ui >= 0.2.11 exporta esta lista como BUILT_IN_ICON_NAMES (y amplía
// IconName); la docs compila contra la versión publicada, así que la copia
// acá con un cast. Al publicar, reemplazar por el import.
const BUILT_IN_ICON_NAMES = [
  'check', 'close', 'plus', 'minus', 'search', 'menu', 'more', 'home', 'settings', 'user',
  'trash', 'edit', 'share', 'heart', 'star', 'eye', 'eye-off',
  'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'alert', 'warning', 'info', 'question',
] as unknown as IconName[];
import { VariantList, type VariantDef } from './VariantList';

export function IconButtonDemo() {
  // #region demo
  const colors = useColors();
  const variants: VariantDef[] = [
    {
      label: 'All built-in icons',
      content: (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 12 }}>
          {BUILT_IN_ICON_NAMES.map((name) => (
            <View key={name} style={{ width: '20%', alignItems: 'center' }}>
              <IconButton iconName={name} accessibilityLabel={name} onPress={() => {}} />
              <Caption align="center">
                {name}
              </Caption>
            </View>
          ))}
        </View>
      ),
    },
    { label: 'close', content: <IconButton iconName="close" accessibilityLabel="Close" onPress={() => {}} /> },
    { label: 'check', content: <IconButton iconName="check" accessibilityLabel="Confirm" onPress={() => {}} /> },
    { label: 'search', content: <IconButton iconName="search" accessibilityLabel="Search" onPress={() => {}} /> },
    { label: 'small', content: <IconButton iconName="check" size={16} accessibilityLabel="Small" onPress={() => {}} /> },
    { label: 'large', content: <IconButton iconName="check" size={32} accessibilityLabel="Large" onPress={() => {}} /> },
    { label: 'custom color', content: <IconButton iconName="check" color={colors.error} accessibilityLabel="Red" onPress={() => {}} /> },
    { label: 'disabled', content: <IconButton iconName="close" accessibilityLabel="Disabled" onPress={() => {}} disabled /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
