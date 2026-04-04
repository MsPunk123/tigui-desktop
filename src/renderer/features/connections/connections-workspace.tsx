import { Button } from '@/renderer/shared/components/ui';

import { ConnectionEditorPanel } from './components/connection-editor-panel';
import { ConnectionList } from './components/connection-list';
import { useConnectionsWorkspace } from './hooks/use-connections-workspace';

export const ConnectionsWorkspace = () => {
  const {
    profiles,
    activeConnectionId,
    activeProfile,
    editorState,
    validationErrors,
    notice,
    isLoading,
    isSubmitting,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
    activateConnection,
    deleteConnection,
    testConnection,
  } = useConnectionsWorkspace();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading connection profiles...</p>;
  }

  const showEmptyState = profiles.length === 0 && editorState.mode === 'closed';

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Connections</h2>
          <p className="text-sm text-muted-foreground">
            Add and manage TigerBeetle database connections.
          </p>
        </div>

        <Button onClick={() => openCreate()}>Add Connection</Button>
      </header>

      {activeProfile ? (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          Active connection: <span className="font-medium">{activeProfile.name}</span>
        </div>
      ) : null}

      {notice ? <div className="rounded-md border px-3 py-2 text-sm">{notice}</div> : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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

      {editorState.mode !== 'closed' ? (
        <ConnectionEditorPanel
          mode={editorState.mode}
          initialValues={editorState.initialValues}
          isSubmitting={isSubmitting}
          onCancel={closeEditor}
          onSubmit={(values) => void submitEditor(values)}
        />
      ) : null}

      {showEmptyState ? (
        <section className="rounded-lg border border-dashed p-6 text-center">
          <h3 className="text-lg font-semibold">No connections yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start by adding a TigerBeetle cluster connection.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => openCreate()}>Add Connection</Button>
          </div>
        </section>
      ) : (
        <ConnectionList
          profiles={profiles}
          activeConnectionId={activeConnectionId}
          onActivate={(profile) => void activateConnection(profile)}
          onTest={(profile) => void testConnection(profile)}
          onEdit={openEdit}
          onDelete={(profile) => void deleteConnection(profile)}
        />
      )}
    </section>
  );
};
