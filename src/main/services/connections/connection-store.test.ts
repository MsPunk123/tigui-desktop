import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (value: string) => Buffer.from(value),
  },
}));

import { ConnectionStore } from './connection-store';
import { TigerBeetleClientManager } from './tigerbeetle-client-manager';

type StubClientManager = Pick<
  TigerBeetleClientManager,
  'connect' | 'test' | 'disconnect' | 'disconnectAll' | 'getConnectedConnectionIds' | 'isConnected'
>;

const createStubClientManager = (): StubClientManager => ({
  connect: vi.fn().mockResolvedValue(['primary']),
  test: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockReturnValue([]),
  disconnectAll: vi.fn(),
  getConnectedConnectionIds: vi.fn().mockReturnValue([]),
  isConnected: vi.fn().mockReturnValue(false),
});

describe('ConnectionStore', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('migrates stored http replica addresses on read', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'tigui-store-'));
    tempDirs.push(tempDir);
    await writeFile(
      path.join(tempDir, 'connections.profiles.json'),
      JSON.stringify({
        profiles: [
          {
            id: 'primary',
            name: 'Primary Cluster',
            clusterId: '0',
            addresses: ['http://127.0.0.1:3001'],
            isDefault: true,
            createdAt: '2026-04-05T00:00:00.000Z',
            updatedAt: '2026-04-05T00:00:00.000Z',
          },
        ],
      }),
      'utf8',
    );

    const store = new ConnectionStore(tempDir, {
      clientManager: createStubClientManager() as TigerBeetleClientManager,
    });

    const profiles = await store.listConnections();
    const persisted = JSON.parse(
      await readFile(path.join(tempDir, 'connections.profiles.json'), 'utf8'),
    ) as { profiles: Array<{ addresses: string[] }> };

    expect(profiles[0]?.addresses).toEqual(['127.0.0.1:3001']);
    expect(persisted.profiles[0]?.addresses).toEqual(['127.0.0.1:3001']);
  });

  it('disconnects active clients before updating connection config', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'tigui-store-'));
    tempDirs.push(tempDir);
    const clientManager = createStubClientManager();
    const store = new ConnectionStore(tempDir, {
      clientManager: clientManager as TigerBeetleClientManager,
    });

    const createResult = await store.createConnection({
      name: 'Primary Cluster',
      clusterId: '0',
      addresses: ['127.0.0.1:3001'],
    });

    if (!createResult.ok) {
      throw new Error('Expected connection creation to succeed in test.');
    }

    await store.updateConnection(createResult.profile.id, {
      name: 'Primary Cluster',
      clusterId: '1',
      addresses: ['127.0.0.1:3002'],
    });

    expect(clientManager.disconnect).toHaveBeenCalledWith(createResult.profile.id);
  });
});
