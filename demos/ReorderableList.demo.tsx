import React, { useState } from 'react';
import { ReorderableList, Card, Body, Caption } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

const INITIAL = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));
const ITEM_HEIGHT = 56;

function Row({ name, dragging }: { name: string; dragging: boolean }) {
  return (
    <Card style={{ marginBottom: 8, opacity: dragging ? 0.85 : 1 }}>
      <Body>{name}</Body>
    </Card>
  );
}

export function ReorderableListDemo() {
  const [data, setData] = useState(INITIAL);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Long-press a row and drag — the rows in between shift out of the way',
      content: (
        <ReorderableList
          data={data}
          keyExtractor={(item) => item.id}
          itemHeight={ITEM_HEIGHT}
          onReorder={setData}
          renderItem={(item, _index, dragging) => <Row name={item.name} dragging={dragging} />}
        />
      ),
    },
    {
      label: 'disabled — rows render but can’t be dragged',
      content: (
        <ReorderableList
          data={INITIAL}
          keyExtractor={(item) => item.id}
          itemHeight={ITEM_HEIGHT}
          disabled
          onReorder={() => {}}
          renderItem={(item, _index, dragging) => <Row name={item.name} dragging={dragging} />}
        />
      ),
    },
  ];
  return (
    <>
      <Caption style={{ marginBottom: 8 }}>Web preview doesn’t simulate touch drag — see the gif on this page.</Caption>
      <VariantList variants={variants} />
    </>
  );
  // #endregion demo
}
