import { fireEvent, render, screen, within } from '@testing-library/react';
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
  queryAccounts: vi.fn().mockResolvedValue({ ok: true, page: { items: [] } }),
  queryAccountBalances: vi.fn().mockResolvedValue({ ok: true, balances: { items: [] } }),
  getAccountsViewPreferences: vi.fn().mockResolvedValue({
    showAllDetailsInRows: false,
    showRawDetailsPanel: true,
    tColumnsEnabled: true,
    debitCreditColorMode: 'semantic_fixed',
    accountsQueryState: {
      ledger: '',
      code: '',
      userData128: '',
      userData64: '',
      userData32: '',
      timestampMin: '',
      timestampMax: '',
      sort: 'desc',
    },
  }),
  updateAccountsViewPreferences: vi.fn().mockImplementation(async (_id, patch) => ({
    showAllDetailsInRows: patch.showAllDetailsInRows ?? false,
    showRawDetailsPanel: patch.showRawDetailsPanel ?? true,
    tColumnsEnabled: patch.tColumnsEnabled ?? true,
    debitCreditColorMode: patch.debitCreditColorMode ?? 'semantic_fixed',
    accountsQueryState: {
      ledger: '',
      code: '',
      userData128: '',
      userData64: '',
      userData32: '',
      timestampMin: '',
      timestampMax: '',
      sort: 'desc',
      ...(patch.accountsQueryState ?? {}),
    },
  })),
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
      listConnections: vi
        .fn()
        .mockResolvedValueOnce([buildConnection()])
        .mockResolvedValue([buildConnection({ isConnected: true })]),
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
      listConnections: vi
        .fn()
        .mockResolvedValueOnce([buildConnection()])
        .mockResolvedValue([buildConnection({ isConnected: true })]),
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
    expect(
      await screen.findByRole('button', { name: 'Open accounts for Primary Cluster' }),
    ).toBeInTheDocument();
  });

  it('opens a reusable accounts tab from connected sidebar child navigation', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection({ isConnected: true })]),
      queryAccounts: vi.fn().mockResolvedValue({
        ok: true,
        page: { items: [] },
      }),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Expand connection row' }));
    await user.click(screen.getByRole('button', { name: 'Open accounts for Primary Cluster' }));

    expect(screen.getByRole('tab', { name: /Primary Cluster Accounts/i })).toBeInTheDocument();
    expect(screen.getByText(/No accounts found for this connection\./i)).toBeInTheDocument();
    expect(window.tigui.queryAccounts).toHaveBeenCalledWith('primary', {
      limit: 100,
      query: {
        ledger: undefined,
        code: undefined,
        userData128: undefined,
        userData64: undefined,
        userData32: undefined,
        timestampMin: undefined,
        timestampMax: undefined,
        sort: 'desc',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Open accounts for Primary Cluster' }));
    expect(screen.getAllByRole('tab', { name: /Primary Cluster Accounts/i })).toHaveLength(1);
  });

  it('renders decoded account flags as raw value plus semantic badges in table and details', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection({ isConnected: true })]),
      queryAccounts: vi.fn().mockResolvedValue({
        ok: true,
        page: {
          items: [
            {
              id: '100',
              debitsPending: '0',
              debitsPosted: '0',
              creditsPending: '0',
              creditsPosted: '0',
              userData128: '0',
              userData64: '0',
              userData32: 0,
              ledger: 700,
              code: 410,
              flags: 10,
              timestamp: '1000',
            },
          ],
        },
      }),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Expand connection row' }));
    await user.click(screen.getByRole('button', { name: 'Open accounts for Primary Cluster' }));

    expect(screen.getAllByText('Debits <= Credits').length).toBeGreaterThan(0);
    expect(screen.getAllByText('History').length).toBeGreaterThan(0);
    expect(screen.getByText(/Raw value:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/get_account_balances can return historical balances\./i),
    ).toBeInTheDocument();
  });

  it('renders human-readable UTC timestamp and exposes raw/iso values in tooltip and details', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection({ isConnected: true })]),
      queryAccounts: vi.fn().mockResolvedValue({
        ok: true,
        page: {
          items: [
            {
              id: '200',
              debitsPending: '0',
              debitsPosted: '0',
              creditsPending: '0',
              creditsPosted: '0',
              userData128: '0',
              userData64: '0',
              userData32: 0,
              ledger: 700,
              code: 410,
              flags: 0,
              timestamp: '1000',
            },
          ],
        },
      }),
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Expand connection row' }));
    await user.click(screen.getByRole('button', { name: 'Open accounts for Primary Cluster' }));

    const humanUtc = '1970-01-01 00:00:00.000 UTC';
    expect(screen.getAllByText(humanUtc).length).toBeGreaterThan(0);
    expect(screen.getByText(/Raw epoch ns:/i)).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();

    await user.hover(screen.getAllByText(humanUtc)[0]);
    expect((await screen.findAllByText(/Raw ns:/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ISO UTC:/i).length).toBeGreaterThan(0);
  });

  it('converts datetime-local timestamp filters to epoch nanoseconds in query payload', async () => {
    const user = userEvent.setup();
    const queryAccounts = vi.fn().mockResolvedValue({
      ok: true,
      page: { items: [] },
    });

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([buildConnection({ isConnected: true })]),
      queryAccounts,
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Expand connection row' }));
    await user.click(screen.getByRole('button', { name: 'Open accounts for Primary Cluster' }));

    const timestampMinInput = document.querySelector(
      'input[placeholder="Timestamp Min"]',
    ) as HTMLInputElement | null;
    const timestampMaxInput = document.querySelector(
      'input[placeholder="Timestamp Max"]',
    ) as HTMLInputElement | null;

    expect(timestampMinInput).not.toBeNull();
    expect(timestampMaxInput).not.toBeNull();

    fireEvent.change(timestampMinInput!, { target: { value: '1970-01-01T00:00:01.000' } });
    fireEvent.change(timestampMaxInput!, { target: { value: '1970-01-01T00:00:02.000' } });
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(queryAccounts).toHaveBeenLastCalledWith('primary', {
      limit: 100,
      query: {
        ledger: undefined,
        code: undefined,
        userData128: undefined,
        userData64: undefined,
        userData32: undefined,
        timestampMin: '1000000000',
        timestampMax: '2000000000',
        sort: 'desc',
      },
    });
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
