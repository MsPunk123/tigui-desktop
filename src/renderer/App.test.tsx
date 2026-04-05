import { render, screen } from '@testing-library/react';
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
    expect(
      screen.getByText(
        'Select a connection from the left panel, or click Connect to start using one.',
      ),
    ).toBeInTheDocument();
  });
});
