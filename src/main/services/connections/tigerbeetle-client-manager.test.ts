import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TigerBeetleClientManager } from './tigerbeetle-client-manager';
import type { ITigerBeetleWorker } from './worker';

const createMockWorker = (): ITigerBeetleWorker => ({
  createClient: vi.fn().mockResolvedValue(undefined),
  verifyClient: vi.fn().mockResolvedValue(undefined),
  destroyClient: vi.fn().mockResolvedValue(undefined),
  destroyAll: vi.fn().mockResolvedValue(undefined),
  dispose: vi.fn(),
});

describe('TigerBeetleClientManager', () => {
  let mockWorker: ITigerBeetleWorker;

  beforeEach(() => {
    mockWorker = createMockWorker();
  });

  it('retains a verified client and reuses it for the same connection config', async () => {
    const manager = new TigerBeetleClientManager(mockWorker);

    await manager.connect('primary', '0', ['localhost:3000']);
    await manager.connect('primary', '0', ['localhost:3000']);

    expect(mockWorker.createClient).toHaveBeenCalledTimes(1);
    expect(mockWorker.verifyClient).toHaveBeenCalledTimes(1);
    expect(manager.getConnectedConnectionIds()).toEqual(['primary']);
  });

  it('closes temporary clients after test verification', async () => {
    const manager = new TigerBeetleClientManager(mockWorker);

    await manager.test('0', ['localhost:3000']);

    expect(mockWorker.createClient).toHaveBeenCalledTimes(1);
    expect(mockWorker.verifyClient).toHaveBeenCalledTimes(1);
    expect(mockWorker.destroyClient).toHaveBeenCalledTimes(1);
    expect(manager.getConnectedConnectionIds()).toEqual([]);
  });

  it('disconnects retained clients and clears manager state', async () => {
    const manager = new TigerBeetleClientManager(mockWorker);

    await manager.connect('primary', '0', ['localhost:3000']);
    const connectedIds = manager.disconnect('primary');

    expect(mockWorker.destroyClient).toHaveBeenCalled();
    expect(connectedIds).toEqual([]);
    expect(manager.isConnected('primary')).toBe(false);
  });
});
