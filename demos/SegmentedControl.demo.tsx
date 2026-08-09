import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, SegmentedControl } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

const RANGES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function SegmentedControlDemo() {
  const [range, setRange] = useState('week');
  const [side, setSide] = useState('left');

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Switch the range of a chart — three options',
      content: (
        <View style={{ gap: 12 }}>
          <SegmentedControl options={RANGES} value={range} onChange={setRange} />
          <Body>Showing the last {range}.</Body>
        </View>
      ),
    },
    {
      label: 'Two options — reads like an on/off switch',
      content: (
        <SegmentedControl
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
          value={side}
          onChange={setSide}
        />
      ),
    },
    {
      label: 'One option disabled — e.g. a plan not available yet',
      content: (
        <SegmentedControl
          options={[...RANGES.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]}
          value={range}
          onChange={setRange}
        />
      ),
    },
    {
      label: 'The whole control disabled — while its data loads',
      content: <SegmentedControl options={RANGES} value={range} onChange={setRange} disabled />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
