import { cn } from '@/renderer/shared/lib/cn';

import { ConnectionForm, type ConnectionFormValues } from './connection-form';

type ConnectionEditorPanelProps = {
  mode: 'create' | 'edit';
  initialValues: ConnectionFormValues;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ConnectionFormValues) => void;
};

export const ConnectionEditorPanel = ({
  mode,
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
}: ConnectionEditorPanelProps) => {
  return (
    <section
      className={cn('rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm', 'sm:p-7')}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            {mode === 'edit' ? 'Connection Settings' : 'Connection Details'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'edit'
              ? 'Update the connection metadata and replica endpoints below.'
              : 'Add the metadata and replica endpoints for this connection.'}
          </p>
        </div>
      </div>
      <div>
        <ConnectionForm
          initialValues={initialValues}
          submitLabel={mode === 'edit' ? 'Save Changes' : 'Create Connection'}
          onCancel={onCancel}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </section>
  );
};
