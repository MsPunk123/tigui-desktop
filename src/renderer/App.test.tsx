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
  activateConnection: vi.fn(),
  getActiveConnection: vi.fn().mockResolvedValue(null),
  testConnection: vi.fn(),
};

describe('App', () => {
  it('renders connection manager shell and empty state', async () => {
    window.tigui = bridgeMock;

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Connection Manager' })).toBeInTheDocument();
    expect(await screen.findByTestId('app-version')).toHaveTextContent('1.0.0');
    expect(screen.getByRole('heading', { name: 'No connections yet' })).toBeInTheDocument();
  });
});
