import { randomUUID } from 'node:crypto';

import type {
  AccountBalancesRequest,
  AccountBalancesResult,
  AccountsPageRequest,
  AccountsPageResult,
  AccountsViewPreferences,
  ConnectionOperationResult,
  ConnectionProfile,
  ConnectionProfileInput,
  ConnectionTestResult,
  QueryConnectedAccountBalancesResult,
  QueryConnectedAccountsResult,
} from '@/shared/connections';

import {
  CONNECTION_NOT_CONNECTED,
  CONNECTION_NOT_FOUND,
  PROFILE_INVALID,
  QUERY_ACCOUNTS_FAILED,
  VERIFY_FAILED,
} from './connection-errors';
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
    delete state.accountsViewPreferencesByConnectionId[id];
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

  async queryConnectedAccounts(
    id: string,
    request: AccountsPageRequest,
  ): Promise<QueryConnectedAccountsResult> {
    const state = await this.readState();
    const profile = state.profiles.find((item) => item.id === id);
    if (!profile) {
      return {
        ok: false,
        code: 'connection_not_found',
        message: CONNECTION_NOT_FOUND,
      };
    }

    if (!this.clientManager.isConnected(id)) {
      return {
        ok: false,
        code: 'connection_not_connected',
        message: CONNECTION_NOT_CONNECTED,
      };
    }

    try {
      const limit = normalizeAccountsLimit(request.limit);
      const cursorTimestampMax = request.cursorTimestampMax
        ? BigInt(request.cursorTimestampMax)
        : undefined;
      const query = toQueryRequest(request.query);
      const accounts = await this.clientManager.queryConnectedAccounts(id, {
        limit,
        cursorTimestampMax,
        query,
      });
      const page: AccountsPageResult = {
        items: accounts.map((account) => ({
          id: account.id.toString(),
          debitsPending: account.debits_pending.toString(),
          debitsPosted: account.debits_posted.toString(),
          creditsPending: account.credits_pending.toString(),
          creditsPosted: account.credits_posted.toString(),
          userData128: account.user_data_128.toString(),
          userData64: account.user_data_64.toString(),
          userData32: account.user_data_32,
          ledger: account.ledger,
          code: account.code,
          flags: account.flags,
          timestamp: account.timestamp.toString(),
        })),
      };

      const last = accounts.at(-1);
      if (accounts.length === limit && last) {
        page.nextCursorTimestampMax = (last.timestamp - 1n).toString();
      }

      return {
        ok: true,
        page,
      };
    } catch (error) {
      return {
        ok: false,
        code: 'query_failed',
        message: error instanceof Error ? error.message : QUERY_ACCOUNTS_FAILED,
      };
    }
  }

  async queryConnectedAccountBalances(
    id: string,
    request: AccountBalancesRequest,
  ): Promise<QueryConnectedAccountBalancesResult> {
    const state = await this.readState();
    const profile = state.profiles.find((item) => item.id === id);
    if (!profile) {
      return {
        ok: false,
        code: 'connection_not_found',
        message: CONNECTION_NOT_FOUND,
      };
    }

    if (!this.clientManager.isConnected(id)) {
      return {
        ok: false,
        code: 'connection_not_connected',
        message: CONNECTION_NOT_CONNECTED,
      };
    }

    try {
      BigInt(request.accountId);
    } catch {
      return {
        ok: false,
        code: 'invalid_account_id',
        message: 'Account id must be a valid integer value.',
      };
    }

    try {
      const limit = normalizeAccountBalancesLimit(request.limit);
      const balances = await this.clientManager.queryConnectedAccountBalances(id, {
        ...request,
        limit,
      });
      const result: AccountBalancesResult = {
        items: balances.map((item) => ({
          debitsPending: item.debits_pending.toString(),
          debitsPosted: item.debits_posted.toString(),
          creditsPending: item.credits_pending.toString(),
          creditsPosted: item.credits_posted.toString(),
          timestamp: item.timestamp.toString(),
        })),
      };

      const last = balances.at(-1);
      if (balances.length === limit && last) {
        result.nextCursorTimestampMax = (last.timestamp - 1n).toString();
      }

      return {
        ok: true,
        balances: result,
      };
    } catch (error) {
      return {
        ok: false,
        code: 'query_failed',
        message: error instanceof Error ? error.message : QUERY_ACCOUNTS_FAILED,
      };
    }
  }

  dispose(): void {
    this.clientManager.disconnectAll();
    this.clientManager.dispose();
  }

  async getAccountsViewPreferences(connectionId: string): Promise<AccountsViewPreferences> {
    const state = await this.readState();
    const profile = state.profiles.find((item) => item.id === connectionId);
    if (!profile) {
      throw new Error(CONNECTION_NOT_FOUND);
    }

    return normalizeAccountsViewPreferences(
      state.accountsViewPreferencesByConnectionId[connectionId],
    );
  }

  async updateAccountsViewPreferences(
    connectionId: string,
    patch: Partial<AccountsViewPreferences>,
  ): Promise<AccountsViewPreferences> {
    const state = await this.readState();
    const profile = state.profiles.find((item) => item.id === connectionId);
    if (!profile) {
      throw new Error(CONNECTION_NOT_FOUND);
    }

    const current = normalizeAccountsViewPreferences(
      state.accountsViewPreferencesByConnectionId[connectionId],
    );
    const next: AccountsViewPreferences = {
      showAllDetailsInRows:
        patch.showAllDetailsInRows === undefined
          ? current.showAllDetailsInRows
          : patch.showAllDetailsInRows,
      showRawDetailsPanel:
        patch.showRawDetailsPanel === undefined
          ? current.showRawDetailsPanel
          : patch.showRawDetailsPanel,
      tColumnsEnabled:
        patch.tColumnsEnabled === undefined ? current.tColumnsEnabled : patch.tColumnsEnabled,
      debitCreditColorMode: patch.debitCreditColorMode ?? current.debitCreditColorMode,
      accountsQueryState: patch.accountsQueryState
        ? {
            ...current.accountsQueryState,
            ...patch.accountsQueryState,
          }
        : current.accountsQueryState,
    };

    state.accountsViewPreferencesByConnectionId[connectionId] = next;
    await this.persistence.writeState(state);
    return next;
  }

  private async readState(): Promise<{
    profiles: StoredConnectionProfile[];
    accountsViewPreferencesByConnectionId: Record<string, AccountsViewPreferences>;
  }> {
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
      const migratedState = {
        profiles,
        accountsViewPreferencesByConnectionId: state.accountsViewPreferencesByConnectionId,
      };
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

const normalizeAccountsLimit = (value: number | undefined): number => {
  if (!value || !Number.isFinite(value)) {
    return 100;
  }

  return Math.max(1, Math.min(8_189, Math.floor(value)));
};

const DEFAULT_ACCOUNTS_VIEW_PREFERENCES: AccountsViewPreferences = {
  showAllDetailsInRows: false,
  showRawDetailsPanel: true,
  tColumnsEnabled: true,
  debitCreditColorMode: 'semantic_fixed',
  accountsQueryState: {
    ledger: '',
    code: '',
    userData128: '',
    userData64: '',
    userData32: '',
    timestampMin: '',
    timestampMax: '',
    sort: 'desc',
  },
};

const normalizeAccountsViewPreferences = (
  value: Partial<AccountsViewPreferences> | undefined,
): AccountsViewPreferences => ({
  showAllDetailsInRows:
    value?.showAllDetailsInRows ?? DEFAULT_ACCOUNTS_VIEW_PREFERENCES.showAllDetailsInRows,
  showRawDetailsPanel:
    value?.showRawDetailsPanel ?? DEFAULT_ACCOUNTS_VIEW_PREFERENCES.showRawDetailsPanel,
  tColumnsEnabled: value?.tColumnsEnabled ?? DEFAULT_ACCOUNTS_VIEW_PREFERENCES.tColumnsEnabled,
  debitCreditColorMode:
    value?.debitCreditColorMode ?? DEFAULT_ACCOUNTS_VIEW_PREFERENCES.debitCreditColorMode,
  accountsQueryState: {
    ...DEFAULT_ACCOUNTS_VIEW_PREFERENCES.accountsQueryState,
    ...(value?.accountsQueryState ?? {}),
  },
});

const normalizeAccountBalancesLimit = (value: number | undefined): number => {
  if (!value || !Number.isFinite(value)) {
    return 20;
  }

  return Math.max(1, Math.min(8_189, Math.floor(value)));
};

const toQueryRequest = (query: AccountsPageRequest['query']) => {
  if (!query) {
    return undefined;
  }

  const next: {
    ledger?: number;
    code?: number;
    userData128?: string;
    userData64?: string;
    userData32?: number;
    timestampMin?: string;
    timestampMax?: string;
    sort?: 'asc' | 'desc';
  } = {};

  if (query.ledger !== undefined) {
    next.ledger = query.ledger;
  }
  if (query.code !== undefined) {
    next.code = query.code;
  }
  if (query.userData128 !== undefined) {
    next.userData128 = query.userData128;
  }
  if (query.userData64 !== undefined) {
    next.userData64 = query.userData64;
  }
  if (query.userData32 !== undefined) {
    next.userData32 = query.userData32;
  }
  if (query.timestampMin !== undefined) {
    next.timestampMin = query.timestampMin;
  }
  if (query.timestampMax !== undefined) {
    next.timestampMax = query.timestampMax;
  }
  if (query.sort !== undefined) {
    next.sort = query.sort;
  }

  return next;
};
