import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { TiguiBridge } from '@/shared/ipc';

import { useConnectionsWorkspace } from './use-connections-workspace';

const buildConnection = (overrides: Record<string, unknown> = {}) => ({
  id: 'primary',
  name: 'Primary Cluster',
  clusterId: '0',
  addresses: ['http://127.0.0.1:3001'],
  environmentTag: 'local',
  isDefault: true,
  isConnected: false,
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
  ...overrides,
});

const buildBridge = (overrides: Partial<TiguiBridge> = {}): TiguiBridge => ({
  getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
  ping: vi.fn().mockResolvedValue('pong:hello'),
  listConnections: vi.fn().mockResolvedValue([buildConnection()]),
  createConnection: vi.fn(),
  updateConnection: vi.fn(),
  deleteConnection: vi.fn(),
  connectConnection: vi.fn().mockResolvedValue({
    ok: true,
    connectedConnectionIds: ['primary'],
  }),
  getConnectedConnectionIds: vi.fn().mockResolvedValue([]),
  testConnection: vi.fn(),
  ...overrides,
});

describe('useConnectionsWorkspace', () => {
  it('keeps tab notices isolated when actions run against one tab id', async () => {
    window.tigui = buildBridge();

    const { result } = renderHook(() => useConnectionsWorkspace());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.connectConnection('connection:primary', buildConnection());
    });

    expect(result.current.getTabUiState('connection:primary').notice).toBe(
      '"Primary Cluster" is now connected.',
    );
    expect(result.current.getTabUiState('connection:secondary').notice).toBeNull();
  });
});
