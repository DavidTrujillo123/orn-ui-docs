import React from 'react';
import { View } from 'react-native';
import { Body, Button, Toast, showAlert, showConfirm, showToast, useToast } from 'orn-ui';
import { VariantList, type VariantDef } from './VariantList';

/**
 * Módulo de negocio puro: sin hooks, sin árbol de React montado que le pase
 * props. Igual habla con el usuario porque showToast/showConfirm/showAlert
 * llaman al provider más cercano por afuera del árbol.
 */
async function deleteInvoice(id: string): Promise<boolean> {
  const confirmed = await showConfirm({
    title: 'Delete invoice',
    message: `Invoice #${id} will be gone for good.`,
    confirmText: 'Delete',
    destructive: true,
  });

  if (!confirmed) {
    showToast({ title: 'Nothing deleted', variant: 'info' });
    return false;
  }

  showToast({ title: 'Invoice deleted', message: `#${id}`, variant: 'success' });
  return true;
}

async function syncInvoices(): Promise<void> {
  showToast({ title: 'Syncing…', variant: 'info', duration: 800 });
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  await showAlert({
    title: 'Sync failed',
    message: 'The server is unreachable. Your changes are saved locally.',
    type: 'error',
  });
}

export function ToastDemo() {
  const { show, hideAll } = useToast();
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Imperative — useToast().show()',
      content: (
        <View style={{ gap: 8 }}>
          <Button title="Success" onPress={() => show({ title: 'Invoice sent', variant: 'success' })} />
          <Button
            title="Error"
            variant="outline"
            onPress={() => show({ title: 'Payment failed', message: 'Try another card.', variant: 'error' })}
          />
          <Button
            title="Warning"
            variant="outline"
            onPress={() => show({ title: 'Unsaved changes', variant: 'warning' })}
          />
          <Button title="Info" variant="outline" onPress={() => show({ title: 'Syncing…', variant: 'info' })} />
        </View>
      ),
    },
    {
      label: 'From business logic — showToast()/showConfirm(), no hook',
      content: (
        <View style={{ gap: 8 }}>
          <Body>Both buttons call a plain async function that imports showToast/showConfirm/showAlert.</Body>
          <Button title="Delete invoice #4821" variant="outline" onPress={() => deleteInvoice('4821')} />
          <Button title="Sync (fails)" variant="outline" onPress={() => syncInvoices()} />
        </View>
      ),
    },
    {
      label: 'Options: duration, tappable, stacking',
      content: (
        <View style={{ gap: 8 }}>
          <Button
            title="Stays until dismissed"
            variant="outline"
            onPress={() => show({ title: 'Sticky toast', message: 'duration: 0', duration: 0 })}
          />
          <Button
            title="Tappable"
            variant="outline"
            onPress={() => show({ title: 'Tap me', message: 'Runs onPress and closes', onPress: () => {} })}
          />
          <Button
            title="Fire three at once"
            variant="outline"
            onPress={() => {
              show({ title: 'First', variant: 'info' });
              show({ title: 'Second', variant: 'success' });
              show({ title: 'Third', variant: 'warning' });
            }}
          />
          <Button title="Dismiss all" variant="ghost" onPress={hideAll} />
        </View>
      ),
    },
    {
      label: 'Static (placed by hand, no provider)',
      content: (
        <View style={{ gap: 8 }}>
          <Toast title="Invoice sent" message="Sent to acme@studio.com" variant="success" />
          <Toast title="Payment failed" variant="error" onDismiss={() => {}} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
