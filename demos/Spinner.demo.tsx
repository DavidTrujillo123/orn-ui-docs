import React from 'react';
import { View } from 'react-native';
import { Spinner, Avatar, Icon } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from './VariantList';

export function SpinnerDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Default — a status message under the spinner',
      content: <Spinner text="Loading invoices..." fullscreen={false} />,
    },
    {
      label: 'Custom look — dots and ring, identical on iOS and Android',
      content: (
        <VariantRow>
          <Spinner variant="dots" text="Fetching..." fullscreen={false} />
          <Spinner variant="ring" text="Syncing..." fullscreen={false} />
        </VariantRow>
      ),
    },
    {
      label: 'Sizes — small for inline use, large for a loading screen',
      content: (
        <VariantRow>
          <Spinner variant="ring" size="small" fullscreen={false} />
          <Spinner variant="ring" size="large" fullscreen={false} />
        </VariantRow>
      ),
    },
    {
      label: 'Custom color — matches your brand accent',
      content: (
        <VariantRow>
          <Spinner variant="dots" color="#00cae1" fullscreen={false} />
          <Spinner variant="ring" color="#ff3b30" fullscreen={false} />
        </VariantRow>
      ),
    },
    {
      label: 'Your own indicator — e.g. an avatar while a photo uploads',
      content: (
        <Spinner
          fullscreen={false}
          text="Uploading..."
          indicator={
            <Avatar size={48} backgroundColor="#004cef20">
              <Icon name="plus" size={24} color="#004cef" />
            </Avatar>
          }
        />
      ),
    },
    {
      label: 'No text — just the wait, next to a button or inline in a row',
      content: (
        <View style={{ alignItems: 'center' }}>
          <Spinner variant="ring" fullscreen={false} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
