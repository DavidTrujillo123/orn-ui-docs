import React from 'react';
import { SymmetricGrid, Card, Body } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

const ITEMS = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));

function Tile({ name }: { name: string }) {
  return (
    <Card>
      <Body>{name}</Body>
    </Card>
  );
}

export function SymmetricGridDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'columns={2} — default, last row of 1 centered',
      content: (
        <SymmetricGrid
          data={ITEMS}
          columns={2}
          keyExtractor={(item) => item.id}
          renderItem={(item) => <Tile name={item.name} />}
        />
      ),
    },
    {
      label: 'columns={3} — same 5 items, different grid',
      content: (
        <SymmetricGrid
          data={ITEMS}
          columns={3}
          keyExtractor={(item) => item.id}
          renderItem={(item) => <Tile name={item.name} />}
        />
      ),
    },
    {
      label: 'balanceLastRow={false} — incomplete row left-aligned instead of centered',
      content: (
        <SymmetricGrid
          data={ITEMS}
          columns={2}
          balanceLastRow={false}
          keyExtractor={(item) => item.id}
          renderItem={(item) => <Tile name={item.name} />}
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
