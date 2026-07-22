import type {
  AccountBalancesRequest,
  AccountsPageRequest,
  AccountsViewPreferences,
  ConnectionOperationResult,
  ConnectionProfile,
  ConnectionProfileInput,
  ConnectionTestResult,
  QueryConnectedAccountBalancesResult,
  QueryConnectedAccountsResult,
} from '@/shared/connections';

export type SystemBridge = {
  getAppVersion: () => Promise<string>;
  ping: (message: string) => Promise<string>;
};

export type ConnectionsBridge = {
  listConnections: () => Promise<ConnectionProfile[]>;
  createConnection: (input: ConnectionProfileInput) => Promise<ConnectionOperationResult>;
  updateConnection: (
    id: string,
    input: ConnectionProfileInput,
  ) => Promise<ConnectionOperationResult>;
  deleteConnection: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  connectConnection: (
    id: string,
  ) => Promise<{ ok: true; connectedConnectionIds: string[] } | { ok: false; message: string }>;
  disconnectConnection: (
    id: string,
  ) => Promise<{ ok: true; connectedConnectionIds: string[] } | { ok: false; message: string }>;
  getConnectedConnectionIds: () => Promise<string[]>;
  testConnection: (
    id: string,
  ) => Promise<{ ok: true; result: ConnectionTestResult } | { ok: false; message: string }>;
  queryAccounts: (
    id: string,
    request: AccountsPageRequest,
  ) => Promise<QueryConnectedAccountsResult>;
  queryAccountBalances: (
    id: string,
    request: AccountBalancesRequest,
  ) => Promise<QueryConnectedAccountBalancesResult>;
  getAccountsViewPreferences: (id: string) => Promise<AccountsViewPreferences>;
  updateAccountsViewPreferences: (
    id: string,
    patch: Partial<AccountsViewPreferences>,
  ) => Promise<AccountsViewPreferences>;
};

export type TiguiBridge = SystemBridge & ConnectionsBridge;
