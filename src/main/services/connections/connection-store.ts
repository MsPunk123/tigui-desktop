import { randomUUID } from 'node:crypto';

import type {
  ConnectionOperationResult,
  ConnectionProfile,
  ConnectionProfileInput,
  ConnectionTestResult,
} from '@/shared/connections';

import { CONNECTION_NOT_FOUND, PROFILE_INVALID, VERIFY_FAILED } from './connection-errors';
import { type StoredConnectionProfile } from './connection-models';
import { ConnectionTester } from './connection-testing';
import { normalizeOptional, parseAddresses, validateProfileInput } from './connection-validation';
import { ConnectionPersistence } from './storage/persistence';
import { ConnectionSecretsStore } from './storage/secrets';
import { TigerBeetleClientManager } from './tigerbeetle-client-manager';

export class ConnectionStore {
  private readonly persistence: ConnectionPersistence;
  private readonly secretsStore: ConnectionSecretsStore;
  private readonly clientManager: TigerBeetleClientManager;
  private readonly tester: ConnectionTester;

  constructor(
    appDataPath: string,
    options: {
      persistence?: ConnectionPersistence;
      secretsStore?: ConnectionSecretsStore;
      clientManager?: TigerBeetleClientManager;
    } = {},
  ) {
    this.persistence = options.persistence ?? new ConnectionPersistence(appDataPath);
    this.secretsStore = options.secretsStore ?? new ConnectionSecretsStore(appDataPath);
    this.clientManager = options.clientManager ?? new TigerBeetleClientManager();
    this.tester = new ConnectionTester(this.clientManager);
  }

  async listConnections(): Promise<ConnectionProfile[]> {
    const state = await this.readState();
    return state.profiles.map((profile) => this.toConnectionProfile(profile));
  }

  async getConnectedConnectionIds(): Promise<string[]> {
    const state = await this.readState();
    const profileIds = new Set(state.profiles.map((profile) => profile.id));
    return this.clientManager.getConnectedConnectionIds().filter((id) => profileIds.has(id));
  }

  async createConnection(input: ConnectionProfileInput): Promise<ConnectionOperationResult> {
    const state = await this.readState();
    const validationErrors = validateProfileInput(input, state.profiles);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        message: PROFILE_INVALID,
        validationErrors,
      };
    }

    const now = new Date().toISOString();
    const profile: StoredConnectionProfile = {
      id: randomUUID(),
      name: input.name.trim(),
      clusterId: input.clusterId.trim(),
      addresses: parseAddresses(input.addresses).normalized,
      environmentTag: normalizeOptional(input.environmentTag),
      isDefault: Boolean(input.setAsDefault) || state.profiles.length === 0,
      lastUsedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (profile.isDefault) {
      state.profiles = state.profiles.map((existing) => ({ ...existing, isDefault: false }));
    }

    state.profiles.push(profile);
    await this.persistence.writeState(state);
    await this.secretsStore.save(profile.id, input.secrets ?? {});

    return {
      ok: true,
      profile: this.toConnectionProfile(profile),
    };
  }

  async updateConnection(
    id: string,
    input: ConnectionProfileInput,
  ): Promise<ConnectionOperationResult> {
    const state = await this.readState();
    const profileIndex = state.profiles.findIndex((profile) => profile.id === id);
    if (profileIndex < 0) {
      return {
        ok: false,
        message: CONNECTION_NOT_FOUND,
      };
    }

    const validationErrors = validateProfileInput(
      input,
      state.profiles.filter((profile) => profile.id !== id),
    );
    if (validationErrors.length > 0) {
      return {
        ok: false,
        message: PROFILE_INVALID,
        validationErrors,
      };
    }

    const existing = state.profiles[profileIndex];
    const updated: StoredConnectionProfile = {
      ...existing,
      name: input.name.trim(),
      clusterId: input.clusterId.trim(),
      addresses: parseAddresses(input.addresses).normalized,
      environmentTag: normalizeOptional(input.environmentTag),
      isDefault:
        input.setAsDefault === undefined ? existing.isDefault : Boolean(input.setAsDefault),
      updatedAt: new Date().toISOString(),
    };

    const connectionConfigChanged =
      existing.clusterId !== updated.clusterId ||
      existing.addresses.join(',') !== updated.addresses.join(',');

    if (connectionConfigChanged) {
      this.clientManager.disconnect(updated.id);
    }

    if (updated.isDefault) {
      state.profiles = state.profiles.map((profile) => ({
        ...profile,
        isDefault: profile.id === updated.id,
      }));
    }

    state.profiles[profileIndex] = updated;
    await this.persistence.writeState(state);

    if (input.secrets && Object.keys(input.secrets).length > 0) {
      await this.secretsStore.save(updated.id, input.secrets);
    }

    return {
      ok: true,
      profile: this.toConnectionProfile(updated),
    };
  }

  async deleteConnection(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const state = await this.readState();
    const existing = state.profiles.find((profile) => profile.id === id);
    if (!existing) {
      return {
        ok: false,
        message: CONNECTION_NOT_FOUND,
      };
    }

    state.profiles = state.profiles.filter((profile) => profile.id !== id);
    this.clientManager.disconnect(id);
    if (existing.isDefault && state.profiles.length > 0) {
      state.profiles[0] = {
        ...state.profiles[0],
        isDefault: true,
      };
    }

    await this.persistence.writeState(state);
    await this.secretsStore.delete(id);

    return { ok: true };
  }

  async connectConnection(
    id: string,
  ): Promise<{ ok: true; connectedConnectionIds: string[] } | { ok: false; message: string }> {
    const state = await this.readState();
    const selected = state.profiles.find((profile) => profile.id === id);
    if (!selected) {
      return {
        ok: false,
        message: CONNECTION_NOT_FOUND,
      };
    }

    try {
      const connectedConnectionIds = await this.clientManager.connect(
        selected.id,
        selected.clusterId,
        selected.addresses,
      );
      state.profiles = state.profiles.map((profile) =>
        profile.id === selected.id
          ? {
              ...profile,
              lastUsedAt: new Date().toISOString(),
            }
          : profile,
      );
      await this.persistence.writeState(state);

      return {
        ok: true,
        connectedConnectionIds,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : VERIFY_FAILED,
      };
    }
  }

  async disconnectConnection(
    id: string,
  ): Promise<{ ok: true; connectedConnectionIds: string[] } | { ok: false; message: string }> {
    const state = await this.readState();
    const selected = state.profiles.find((profile) => profile.id === id);
    if (!selected) {
      return {
        ok: false,
        message: CONNECTION_NOT_FOUND,
      };
    }

    return {
      ok: true,
      connectedConnectionIds: this.clientManager.disconnect(id),
    };
  }

  async testConnection(
    id: string,
  ): Promise<{ ok: true; result: ConnectionTestResult } | { ok: false; message: string }> {
    const state = await this.readState();
    const profile = state.profiles.find((item) => item.id === id);
    if (!profile) {
      return {
        ok: false,
        message: CONNECTION_NOT_FOUND,
      };
    }

    return {
      ok: true,
      result: await this.tester.testConnection(profile),
    };
  }

  dispose(): void {
    this.clientManager.disconnectAll();
    this.clientManager.dispose();
  }

  private async readState(): Promise<{ profiles: StoredConnectionProfile[] }> {
    const state = await this.persistence.readState();
    let didMigrate = false;

    const profiles = state.profiles.map((profile) => {
      const normalizedAddresses = parseAddresses(profile.addresses).normalized;
      const nonEmptyCount = profile.addresses.filter((address) => address.trim().length > 0).length;
      const shouldReplace =
        normalizedAddresses.length === nonEmptyCount &&
        normalizedAddresses.join(',') !== profile.addresses.join(',');

      if (!shouldReplace) {
        return profile;
      }

      didMigrate = true;
      return {
        ...profile,
        addresses: normalizedAddresses,
      };
    });

    if (didMigrate) {
      const migratedState = { profiles };
      await this.persistence.writeState(migratedState);
      return migratedState;
    }

    return state;
  }

  private toConnectionProfile(profile: StoredConnectionProfile): ConnectionProfile {
    return {
      ...profile,
      isConnected: this.clientManager.isConnected(profile.id),
    };
  }
}
