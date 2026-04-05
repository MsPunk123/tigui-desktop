import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConnectionForm, type ConnectionFormValues } from './connection-form';

const initialValues: ConnectionFormValues = {
  name: '',
  clusterId: '',
  replicaUrls: ['http://127.0.0.1:3001'],
  environmentTag: '',
  setAsDefault: false,
  secrets: [],
};

describe('ConnectionForm', () => {
  it('submits the same form value shape using shadcn controls', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ConnectionForm
        initialValues={initialValues}
        submitLabel="Create Connection"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Connection Name'), 'Primary Cluster');
    await user.type(screen.getByLabelText('Cluster ID'), '0');
    await user.type(screen.getByLabelText('Environment Tag (Optional)'), 'local');
    await user.click(screen.getByLabelText('Set as default connection'));
    await user.click(screen.getByRole('button', { name: 'Add Secret' }));
    await user.type(screen.getByPlaceholderText('api_key'), 'token');
    await user.type(screen.getByPlaceholderText('value'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Create Connection' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Primary Cluster',
      clusterId: '0',
      replicaUrls: ['http://127.0.0.1:3001'],
      environmentTag: 'local',
      setAsDefault: true,
      secrets: [{ key: 'token', value: 'secret' }],
    });
  });

  it('supports adding and removing replica URLs with validation feedback intact', async () => {
    const user = userEvent.setup();

    render(
      <ConnectionForm
        initialValues={initialValues}
        submitLabel="Create Connection"
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add URL' }));

    const urlInputs = screen.getAllByPlaceholderText('http://127.0.0.1:3001');
    await user.clear(urlInputs[1]);
    await user.type(urlInputs[1], 'invalid-url');

    expect(
      screen.getByText('Use a valid http:// or https:// URL with explicit host and port.'),
    ).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);

    expect(screen.getAllByPlaceholderText('http://127.0.0.1:3001')).toHaveLength(1);
  });
});
