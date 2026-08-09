import React, { useState } from 'react';
import { View } from 'react-native';
import { Steps, Button } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

const STEPS = [
  { label: 'Account', description: 'Your details' },
  { label: 'Payment', description: 'Card or cash' },
  { label: 'Confirm' },
];

const LONG_STEPS = [
  { label: 'Payment Confirmed', description: 'Verified' },
  { label: 'Warehouse', description: 'Packed' },
  { label: 'On The Road', description: 'Out for delivery' },
  { label: 'Delivered', description: 'Delivered to destination' },
];

export function StepsDemo() {
  const [current, setCurrent] = useState(1);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'A checkout in progress — on the Payment step',
      content: <Steps steps={STEPS} current={1} />,
    },
    {
      label: 'completedIndicator="number" — the step count instead of a check',
      content: <Steps steps={STEPS} current={2} completedIndicator="number" />,
    },
    {
      label: 'orientation="vertical" — reads better with long descriptions',
      content: <Steps steps={STEPS} current={1} orientation="vertical" />,
    },
    {
      label: 'Before you start — nothing completed yet',
      content: <Steps steps={STEPS} current={0} />,
    },
    {
      label: 'All done — every step completed',
      content: <Steps steps={STEPS} current={3} />,
    },
    {
      // Cada paso tiene ancho mínimo: la fila scrollea antes que apretar las
      // columnas y dejar que RN parta las etiquetas a la mitad.
      label: 'Long labels — the row scrolls instead of breaking words',
      content: <Steps steps={LONG_STEPS} current={3} />,
    },
    {
      label: 'onStepPress — let people jump back and fix a step',
      content: (
        <View style={{ gap: 16 }}>
          <Steps steps={STEPS} current={current} onStepPress={setCurrent} />
          <Button
            title="Advance"
            variant="outline"
            onPress={() => setCurrent((c) => Math.min(c + 1, STEPS.length))}
          />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
