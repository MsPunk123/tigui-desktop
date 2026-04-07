import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import App from './App';

const buildConnection = (overrides: Record<string, unknown> = {}) => ({
  id: 'primary',
  name: 'Primary Cluster',
  clusterId: '0',
  addresses: ['127.0.0.1:3001'],
  environmentTag: 'local',
  isDefault: true,
  isConnected: false,
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
  ...overrides,
});

const bridgeMock = {
  getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
  ping: vi.fn().mockResolvedValue('pong:hello'),
  listConnections: vi.fn().mockResolvedValue([]),
  createConnection: vi.fn(),
  updateConnection: vi.fn(),
  deleteConnection: vi.fn(),
  connectConnection: vi.fn(),
  disconnectConnection: vi.fn(),
  getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
  testConnection: vi.fn(),
};

describe('App', () => {
  it('renders platform shell with sidebar and empty shared workbench by default', async () => {
    window.tigui = bridgeMock;

    render(<App />);

    expect(await screen.findByText('TigUI Desktop')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connections (0)' })).toBeInTheDocument();
    expect(screen.getByText('No connection selected')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Select a connection from the left panel, or click Connect to start using one.',
      ),
    ).toBeInTheDocument();
  });

  it('opens and focuses one shared workbench tab per connection from the sidebar', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection()]),
      connectConnection: vi.fn().mockResolvedValue({
        ok: true,
        connectedConnectionIds: ['primary'],
      }),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    const rowButton = await screen.findByRole('button', { name: /Primary Cluster/i });
    expect(rowButton.tagName).toBe('BUTTON');

    await user.click(rowButton);
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    const workbenchTab = screen.getByRole('tab', { name: /Primary Cluster/i });
    expect(workbenchTab).toHaveAttribute('aria-selected', 'true');
    expect(workbenchTab.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('127.0.0.1:3001')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();

    await user.click(rowButton);
    expect(screen.getAllByRole('tab')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Close Primary Cluster' }));
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('No connection selected')).toBeInTheDocument();
  });

  it('keeps connect and expand controls semantic while opening content in the shared workbench', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection()]),
      connectConnection: vi.fn().mockResolvedValue({
        ok: true,
        connectedConnectionIds: ['primary'],
      }),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Connect' }));
    expect(window.tigui.connectConnection).toHaveBeenCalledWith('primary');
    expect(screen.getByText(/is now connected to tigerbeetle\./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand connection row' }));
    expect(screen.getByText('Module area placeholder (future).')).toBeInTheDocument();
  });

  it('keeps medium connection names readable while preserving right-side actions', async () => {
    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([
        buildConnection({
          id: 'medium-name',
          name: 'dzfsdf',
          environmentTag: 'gdfg',
        }),
        buildConnection({
          id: 'connected-medium',
          name: 'sdfsd',
          environmentTag: 'aefsdfs',
          isConnected: true,
          isDefault: false,
        }),
      ]),
      getConnectedConnectionIds: vi.fn().mockResolvedValue(['connected-medium']),
    };

    render(<App />);

    expect(await screen.findByRole('button', { name: /dzfsdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sdfsd/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Expand connection row' }).length).toBeGreaterThan(
      0,
    );
  });

  it('closes the editor overlay when switching tabs so tabs stay isolated', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([
        buildConnection(),
        buildConnection({
          id: 'secondary',
          name: 'Secondary Cluster',
          clusterId: '1',
          addresses: ['127.0.0.1:3002'],
          environmentTag: 'staging',
          isDefault: false,
        }),
      ]),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Primary Cluster/i }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit Connection' });
    expect(
      within(dialog).getByText(
        'Update connection details without leaving the active workbench tab.',
      ),
    ).toBeInTheDocument();
    const editSheetBody = dialog.querySelector('[data-slot="connections-sheet-body"]');
    expect(editSheetBody).not.toBeNull();
    expect(editSheetBody).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto');

    await user.click(screen.getByRole('button', { name: /Secondary Cluster/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Secondary Cluster/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('127.0.0.1:3002')).toBeInTheDocument();
  });

  it('opens create connection in an overlay without replacing active tab content', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection()]),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Primary Cluster/i }));
    expect(screen.getByText('127.0.0.1:3001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add connection' }));

    const dialog = await screen.findByRole('dialog', { name: 'Create Connection' });
    expect(
      within(dialog).getByText('Create a new connection profile from the shared workbench.'),
    ).toBeInTheDocument();
    const createSheetBody = dialog.querySelector('[data-slot="connections-sheet-body"]');
    expect(createSheetBody).not.toBeNull();
    expect(createSheetBody).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto');
    expect(screen.getByText('127.0.0.1:3001')).toBeInTheDocument();
  });

  it('keeps notices isolated to the tab that triggered them', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([
        buildConnection(),
        buildConnection({
          id: 'secondary',
          name: 'Secondary Cluster',
          clusterId: '1',
          addresses: ['127.0.0.1:3002'],
          environmentTag: 'staging',
          isDefault: false,
        }),
      ]),
      connectConnection: vi.fn().mockResolvedValue({
        ok: true,
        connectedConnectionIds: ['primary'],
      }),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Primary Cluster/i }));
    await user.click(screen.getAllByRole('button', { name: 'Connect' }).at(-1)!);
    expect(
      screen.getByText(/"Primary Cluster" is now connected to TigerBeetle\./i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Secondary Cluster/i }));
    expect(
      screen.queryByText(/"Primary Cluster" is now connected to TigerBeetle\./i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Primary Cluster/i }));
    expect(
      screen.getByText(/"Primary Cluster" is now connected to TigerBeetle\./i),
    ).toBeInTheDocument();
  });

  it('clears tab-local notices when a tab is closed and reopened', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection()]),
      connectConnection: vi.fn().mockResolvedValue({
        ok: true,
        connectedConnectionIds: ['primary'],
      }),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Primary Cluster/i }));
    await user.click(screen.getAllByRole('button', { name: 'Connect' }).at(-1)!);
    expect(
      screen.getByText(/"Primary Cluster" is now connected to TigerBeetle\./i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close Primary Cluster' }));
    expect(
      screen.queryByText(/"Primary Cluster" is now connected to TigerBeetle\./i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Primary Cluster/i }));
    expect(
      screen.queryByText(/"Primary Cluster" is now connected to TigerBeetle\./i),
    ).not.toBeInTheDocument();
  });

  it('keeps validation feedback scoped to the originating tab', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([
        buildConnection(),
        buildConnection({
          id: 'secondary',
          name: 'Secondary Cluster',
          clusterId: '1',
          addresses: ['127.0.0.1:3002'],
          environmentTag: 'staging',
          isDefault: false,
        }),
      ]),
      updateConnection: vi.fn().mockResolvedValue({
        ok: false,
        message: 'Validation failed.',
        validationErrors: [{ field: 'name', message: 'Name is already taken.' }],
      }),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Primary Cluster/i }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit Connection' });
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(screen.getByText('Validation failed.')).toBeInTheDocument();
    expect(screen.getByText('name: Name is already taken.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Secondary Cluster/i }));
    expect(screen.queryByText('Validation failed.')).not.toBeInTheDocument();
    expect(screen.queryByText('name: Name is already taken.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Primary Cluster/i }));
    expect(screen.getByText('Validation failed.')).toBeInTheDocument();
    expect(screen.getByText('name: Name is already taken.')).toBeInTheDocument();
  });
});
