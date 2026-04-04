import { randomUUID } from 'node:crypto';

import type {
  ConnectionOperationResult,
  ConnectionProfile,
  ConnectionProfileInput,
  ConnectionTestResult,
} from '@/shared/connections';

import { type StoredConnectionProfile } from './connection-models';
import { ConnectionPersistence } from './connection-persistence';
import { ConnectionSecretsStore } from './connection-secrets';
import { ConnectionTester } from './connection-testing';
import { normalizeOptional, parseAddresses, validateProfileInput } from './connection-validation';

export class ConnectionStore {
  private readonly persistence: ConnectionPersistence;
  private readonly secretsStore: ConnectionSecretsStore;
  private readonly tester: ConnectionTester;

  constructor(appDataPath: string) {
    this.persistence = new ConnectionPersistence(appDataPath);
    this.secretsStore = new ConnectionSecretsStore(appDataPath);
    this.tester = new ConnectionTester();
  }

  async listConnections(): Promise<ConnectionProfile[]> {
    const state = await this.persistence.readState();
    return state.profiles.map((profile) => ({
      ...profile,
      isActive: state.activeConnectionId === profile.id,
    }));
  }

  async getActiveConnection(): Promise<ConnectionProfile | null> {
    const state = await this.persistence.readState();
    const activeProfile = state.profiles.find((profile) => profile.id === state.activeConnectionId);
    if (!activeProfile) {
      return null;
    }

    return {
      ...activeProfile,
      isActive: true,
    };
  }

  async createConnection(input: ConnectionProfileInput): Promise<ConnectionOperationResult> {
    const state = await this.persistence.readState();
    const validationErrors = validateProfileInput(input, state.profiles);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        message: 'Connection profile is invalid.',
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
    if (!state.activeConnectionId) {
      state.activeConnectionId = profile.id;
    }

    await this.persistence.writeState(state);
    await this.secretsStore.save(profile.id, input.secrets ?? {});

    return {
      ok: true,
      profile: {
        ...profile,
        isActive: state.activeConnectionId === profile.id,
      },
    };
  }

  async updateConnection(
    id: string,
    input: ConnectionProfileInput,
  ): Promise<ConnectionOperationResult> {
    const state = await this.persistence.readState();
    const profileIndex = state.profiles.findIndex((profile) => profile.id === id);
    if (profileIndex < 0) {
      return {
        ok: false,
        message: 'Connection was not found.',
      };
    }

    const validationErrors = validateProfileInput(
      input,
      state.profiles.filter((profile) => profile.id !== id),
    );
    if (validationErrors.length > 0) {
      return {
        ok: false,
        message: 'Connection profile is invalid.',
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
      profile: {
        ...updated,
        isActive: state.activeConnectionId === updated.id,
      },
    };
  }

  async deleteConnection(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const state = await this.persistence.readState();
    const existing = state.profiles.find((profile) => profile.id === id);
    if (!existing) {
      return {
        ok: false,
        message: 'Connection was not found.',
      };
    }

    state.profiles = state.profiles.filter((profile) => profile.id !== id);
    if (state.activeConnectionId === id) {
      state.activeConnectionId = state.profiles[0]?.id ?? null;
    }
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

  async activateConnection(
    id: string,
  ): Promise<{ ok: true; activeConnectionId: string } | { ok: false; message: string }> {
    const state = await this.persistence.readState();
    const selected = state.profiles.find((profile) => profile.id === id);
    if (!selected) {
      return {
        ok: false,
        message: 'Connection was not found.',
      };
    }

    state.activeConnectionId = selected.id;
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
      activeConnectionId: selected.id,
    };
  }

  async testConnection(
    id: string,
  ): Promise<{ ok: true; result: ConnectionTestResult } | { ok: false; message: string }> {
    const state = await this.persistence.readState();
    const profile = state.profiles.find((item) => item.id === id);
    if (!profile) {
      return {
        ok: false,
        message: 'Connection was not found.',
      };
    }

    const addressResults = await Promise.all(
      profile.addresses.map(async (address) => {
        const result = await this.tester.testAddress(address);
        return {
          address,
          reachable: result.reachable,
          message: result.message,
        };
      }),
    );

    const passed = addressResults.every((item) => item.reachable);
    return {
      ok: true,
      result: {
        passed,
        testedAt: new Date().toISOString(),
        message: passed
          ? 'All replica addresses are reachable.'
          : 'One or more replica addresses are unreachable.',
        addressResults,
      },
    };
  }
}
