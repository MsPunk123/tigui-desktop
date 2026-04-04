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
    <section className="rounded-lg border p-4">
      <h3 className="mb-4 text-base font-semibold">
        {mode === 'edit' ? 'Edit Connection' : 'New Connection'}
      </h3>
      <ConnectionForm
        initialValues={initialValues}
        submitLabel={mode === 'edit' ? 'Save Changes' : 'Create Connection'}
        onCancel={onCancel}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </section>
  );
};
