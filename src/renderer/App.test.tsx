import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import App from './App';

const bridgeMock = {
  getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
  ping: vi.fn().mockResolvedValue('pong:hello'),
  listConnections: vi.fn().mockResolvedValue([]),
  createConnection: vi.fn(),
  updateConnection: vi.fn(),
  deleteConnection: vi.fn(),
  connectConnection: vi.fn(),
  getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
  testConnection: vi.fn(),
};

describe('App', () => {
  it('renders platform shell with sidebar and blank default workspace', async () => {
    window.tigui = bridgeMock;

    render(<App />);

    expect(await screen.findByText('TigUI Desktop')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connections (0)' })).toBeInTheDocument();
    expect(screen.getByText('No connection selected')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Select a connection from the left panel, or click Connect to start using one.',
      ),
    ).toBeInTheDocument();
  });

  it('uses semantic controls for selecting, connecting, and expanding a connection row', async () => {
    const user = userEvent.setup();

    window.tigui = {
      ...bridgeMock,
      listConnections: vi.fn().mockResolvedValue([
        {
          id: 'primary',
          name: 'Primary Cluster',
          clusterId: '0',
          addresses: ['http://127.0.0.1:3001'],
          environmentTag: 'local',
          isDefault: true,
          isConnected: false,
          createdAt: '2026-04-05T00:00:00.000Z',
          updatedAt: '2026-04-05T00:00:00.000Z',
        },
      ]),
      connectConnection: vi.fn().mockResolvedValue({
        ok: true,
        connectedConnectionIds: ['primary'],
      }),
      getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
    };

    render(<App />);

    const rowButton = await screen.findByRole('button', { name: /Primary Cluster/i });
    expect(rowButton.tagName).toBe('BUTTON');

    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(window.tigui.connectConnection).toHaveBeenCalledWith('primary');
    expect(screen.getByText('No connection selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand connection row' }));
    expect(screen.getByText('Module area placeholder (future).')).toBeInTheDocument();

    await user.click(rowButton);
    expect(screen.getByText('http://127.0.0.1:3001')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
  });
});
