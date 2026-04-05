import { Card, CardContent, CardHeader, CardTitle } from '@/renderer/shared/components/ui';

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
    <Card className="border">
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Connection' : 'New Connection'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ConnectionForm
          initialValues={initialValues}
          submitLabel={mode === 'edit' ? 'Save Changes' : 'Create Connection'}
          onCancel={onCancel}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
