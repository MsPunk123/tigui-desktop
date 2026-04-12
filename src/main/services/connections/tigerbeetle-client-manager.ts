import type { AccountBalancesRequest, AccountsQueryRequest } from '@/shared/connections';

import { CONNECTION_NOT_CONNECTED, VERIFY_FAILED, VERIFY_TIMEOUT } from './connection-errors';
import { CONNECTION_VERIFY_TIMEOUT_MS } from './connection-models';
import { resolveReplicaAddresses } from './replica-address-resolver';
import { type ITigerBeetleWorker, TigerBeetleWorker } from './worker';
import type { WorkerAccountBalance, WorkerQueryAccount } from './worker/protocol';

type ConnectedEntry = {
  configKey: string;
};

export class TigerBeetleClientManager {
  private readonly connections = new Map<string, ConnectedEntry>();
  private readonly worker: ITigerBeetleWorker;
  private testCounter = 0;

  constructor(worker?: ITigerBeetleWorker) {
    this.worker = worker ?? new TigerBeetleWorker();
  }

  async connect(connectionId: string, clusterId: string, addresses: string[]): Promise<string[]> {
    const resolvedAddresses = await resolveReplicaAddresses(addresses);
    const configKey = toConfigKey(clusterId, resolvedAddresses);
    const existing = this.connections.get(connectionId);

    if (existing?.configKey === configKey) {
      return this.getConnectedConnectionIds();
    }

    if (existing) {
      await this.worker.destroyClient(connectionId).catch(() => {
        /* ignore */
      });
      this.connections.delete(connectionId);
    }

    try {
      await this.worker.createClient(connectionId, clusterId, resolvedAddresses);
      await this.verifyWithTimeout(connectionId);
      this.connections.set(connectionId, { configKey });
      return this.getConnectedConnectionIds();
    } catch (error) {
      await this.worker.destroyClient(connectionId).catch(() => {
        /* ignore */
      });
      throw toConnectionError(error);
    }
  }

  async test(clusterId: string, addresses: string[]): Promise<void> {
    const resolvedAddresses = await resolveReplicaAddresses(addresses);
    const clientId = `__test_${this.testCounter++}`;
    try {
      await this.worker.createClient(clientId, clusterId, resolvedAddresses);
      await this.verifyWithTimeout(clientId);
    } catch (error) {
      throw toConnectionError(error);
    } finally {
      await this.worker.destroyClient(clientId).catch(() => {
        /* ignore */
      });
    }
  }

  async queryConnectedAccounts(
    connectionId: string,
    request: {
      limit: number;
      cursorTimestampMax?: bigint;
      query?: AccountsQueryRequest;
    },
  ): Promise<WorkerQueryAccount[]> {
    if (!this.isConnected(connectionId)) {
      throw new Error(CONNECTION_NOT_CONNECTED);
    }

    const query = request.query ?? {};
    return this.worker.queryAccounts(connectionId, {
      user_data_128: query.userData128 ?? '0',
      user_data_64: query.userData64 ?? '0',
      user_data_32: query.userData32 ?? 0,
      ledger: query.ledger ?? 0,
      code: query.code ?? 0,
      timestamp_min: query.timestampMin ?? '0',
      timestamp_max: request.cursorTimestampMax
        ? request.cursorTimestampMax.toString()
        : (query.timestampMax ?? '0'),
      limit: request.limit,
      flags: query.sort === 'asc' ? 0 : 1, // QueryFilterFlags.reversed when descending
    });
  }

  async queryConnectedAccountBalances(
    connectionId: string,
    request: AccountBalancesRequest,
  ): Promise<WorkerAccountBalance[]> {
    if (!this.isConnected(connectionId)) {
      throw new Error(CONNECTION_NOT_CONNECTED);
    }

    return this.worker.getAccountBalances(connectionId, {
      account_id: request.accountId,
      user_data_128: '0',
      user_data_64: '0',
      user_data_32: 0,
      code: 0,
      timestamp_min: '0',
      timestamp_max: request.cursorTimestampMax ?? '0',
      limit: request.limit ?? 20,
      flags: request.sort === 'asc' ? 3 : 7, // debits|credits with optional reversed
    });
  }

  disconnect(connectionId: string): string[] {
    if (this.connections.has(connectionId)) {
      this.worker.destroyClient(connectionId).catch(() => {
        /* ignore */
      });
      this.connections.delete(connectionId);
    }
    return this.getConnectedConnectionIds();
  }

  disconnectAll(): void {
    this.worker.destroyAll().catch(() => {
      /* ignore */
    });
    this.connections.clear();
  }

  getConnectedConnectionIds(): string[] {
    return [...this.connections.keys()];
  }

  isConnected(connectionId: string): boolean {
    return this.connections.has(connectionId);
  }

  dispose(): void {
    this.worker.dispose();
    this.connections.clear();
  }

  private async verifyWithTimeout(clientId: string): Promise<void> {
    let timeoutHandle: NodeJS.Timeout | null = null;
    try {
      await Promise.race([
        this.worker.verifyClient(clientId),
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(VERIFY_TIMEOUT));
          }, CONNECTION_VERIFY_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

const toConfigKey = (clusterId: string, addresses: string[]): string =>
  `${clusterId}:${addresses.join(',')}`;

const toConnectionError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(VERIFY_FAILED);
