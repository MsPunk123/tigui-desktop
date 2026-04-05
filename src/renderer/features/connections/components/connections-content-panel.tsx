import { Server } from 'lucide-react';

import { useConnectionsModuleContext } from '@/renderer/app/modules/connections/connections-module-provider';
import { renderWorkbenchTabContent, useWorkbench } from '@/renderer/app/workbench';
import {
  EMPTY_CONNECTION_FORM,
  toConnectionFormValues,
} from '@/renderer/features/connections/mappers/to-profile-input';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/renderer/shared/components/ui';

import { ConnectionEditorPanel } from './connection-editor-panel';

export const ConnectionsContentPanel = () => {
  const { overlayState, profiles, isSubmitting, closeEditor, submitEditor, getTabUiState } =
    useConnectionsModuleContext();
  const { activeTab, activeTabId } = useWorkbench();
  const tabUiState = getTabUiState(activeTabId);
  const { notice, validationErrors } = tabUiState;
  const editingProfile =
    overlayState.mode === 'edit'
      ? (profiles.find((profile) => profile.id === overlayState.connectionId) ?? null)
      : null;
  const overlayInitialValues =
    overlayState.mode === 'edit' && editingProfile
      ? toConnectionFormValues(editingProfile)
      : EMPTY_CONNECTION_FORM;

  return (
    <>
      {notice ? <div className="mb-4 rounded-md border px-3 py-2 text-sm">{notice}</div> : null}

      {validationErrors.length > 0 ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">Please fix the following:</p>
          <ul className="ml-4 list-disc">
            {validationErrors.map((error) => (
              <li key={`${error.field}-${error.message}`}>
                {error.field}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeTab ? (
        renderWorkbenchTabContent(activeTab)
      ) : (
        <Empty className="min-h-[280px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Server className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No connection selected</EmptyTitle>
            <EmptyDescription>
              Select a connection from the left panel, or click Connect to start using one.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Sheet
        modal={false}
        open={overlayState.mode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) {
            closeEditor();
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>
              {overlayState.mode === 'edit' ? 'Edit Connection' : 'Create Connection'}
            </SheetTitle>
            <SheetDescription>
              {overlayState.mode === 'edit'
                ? 'Update connection details without leaving the active workbench tab.'
                : 'Create a new connection profile from the shared workbench.'}
            </SheetDescription>
          </SheetHeader>
          {overlayState.mode === 'edit' && !editingProfile ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">
              This connection is no longer available.
            </div>
          ) : (
            <div className="px-6 py-6">
              <ConnectionEditorPanel
                mode={overlayState.mode === 'edit' ? 'edit' : 'create'}
                initialValues={overlayInitialValues}
                isSubmitting={isSubmitting}
                onCancel={closeEditor}
                onSubmit={(values) =>
                  void submitEditor(
                    overlayState.mode === 'closed' ? null : overlayState.originTabId,
                    values,
                  )
                }
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
