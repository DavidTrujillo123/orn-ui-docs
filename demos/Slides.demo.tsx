import React, { useState } from 'react';
import { View } from 'react-native';
import { Slides, Button, Title, Body, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

interface Slide {
  id: string;
  title: string;
  body: string;
  gradient: string[];
}

const SLIDES: Slide[] = [
  { id: '1', title: 'Zero dependencies', body: 'Only react and react-native', gradient: ['#004cef', '#00cae1'] },
  { id: '2', title: 'Light and dark', body: 'Every pair clears WCAG AA', gradient: ['#7b2ff7', '#f107a3'] },
  { id: '3', title: 'Expo SDK 54-57', body: 'Verified on all four', gradient: ['#0f9b0f', '#00cae1'] },
];

const FLAT = ['#101014', '#1d2b3a', '#3a1d2b'];
const STAGE = { height: 260, width: '100%' } as const;

function Panel({ slide, onPress }: { slide: Slide; onPress?: () => void }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 8, padding: 24 }}>
      <Title style={{ color: colors.white }}>{slide.title}</Title>
      <Body style={{ color: colors.white }}>{slide.body}</Body>
      {!!onPress && <Button title="Got it" variant="secondary" onPress={onPress} style={{ alignSelf: 'flex-start' }} />}
    </View>
  );
}

export function SlidesDemo() {
  const [tapped, setTapped] = useState<string | null>(null);

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'horizontal · gradient · dots · infinite + autoPlay',
      content: (
        <View style={STAGE}>
          <Slides
            data={SLIDES}
            keyExtractor={(item) => item.id}
            background={(item) => item.gradient}
            renderItem={(item) => <Panel slide={item} />}
            loop
            autoPlay
            interval={2500}
          />
        </View>
      ),
    },
    {
      label: 'numbered indicators · flat colors · finite · button inside',
      content: (
        <View style={{ width: '100%', gap: 8 }}>
          <View style={STAGE}>
            <Slides
              data={SLIDES}
              keyExtractor={(item) => item.id}
              background={(item, index) => FLAT[index]}
              renderItem={(item) => <Panel slide={item} onPress={() => setTapped(item.title)} />}
              indicators="numbers"
            />
          </View>
          <Body>{tapped ? `pressed: ${tapped}` : 'press the button inside a slide'}</Body>
        </View>
      ),
    },
    {
      label: 'vertical orientation',
      content: (
        <View style={STAGE}>
          <Slides
            data={SLIDES}
            keyExtractor={(item) => item.id}
            background={(item) => item.gradient}
            renderItem={(item) => <Panel slide={item} />}
            orientation="vertical"
          />
        </View>
      ),
    },
  ];
  // #endregion demo
  return <VariantList variants={variants} />;
}
