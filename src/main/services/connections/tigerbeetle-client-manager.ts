import { VERIFY_FAILED, VERIFY_TIMEOUT } from './connection-errors';
import { CONNECTION_VERIFY_TIMEOUT_MS } from './connection-models';
import { resolveReplicaAddresses } from './replica-address-resolver';
import { type ITigerBeetleWorker, TigerBeetleWorker } from './worker';

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
