import React from 'react';
import { View } from 'react-native';
import { Screen, Body, Subtitle } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

export function ScreenDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'A typical screen — scrolls, respects the top safe area',
      content: (
        <View style={{ height: 160, borderRadius: 12, overflow: 'hidden' }}>
          <Screen edges={['top']}>
            <View style={{ gap: 8 }}>
              <Subtitle>Recent activity</Subtitle>
              <Body>Invoice #4821 was paid.</Body>
              <Body>Invoice #4820 is due in 3 days.</Body>
              <Body>Invoice #4819 was paid.</Body>
            </View>
          </Screen>
        </View>
      ),
    },
    {
      label: 'scrollable={false} — for content that brings its own list',
      content: (
        <View style={{ height: 80, borderRadius: 12, overflow: 'hidden' }}>
          <Screen scrollable={false} edges={[]}>
            <Body>Turn scrolling off so it doesn’t fight with a nested List or Wizard.</Body>
          </Screen>
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
