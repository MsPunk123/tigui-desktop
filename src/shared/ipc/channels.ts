export const SYSTEM_CHANNELS = {
  getAppVersion: 'app:get-version',
  ping: 'system:ping',
} as const;

export const CONNECTION_CHANNELS = {
  listConnections: 'connections:list',
  createConnection: 'connections:create',
  updateConnection: 'connections:update',
  deleteConnection: 'connections:delete',
  connectConnection: 'connections:connect',
  disconnectConnection: 'connections:disconnect',
  getConnectedConnectionIds: 'connections:get-connected-ids',
  testConnection: 'connections:test',
  queryAccounts: 'connections:query-accounts',
  queryAccountBalances: 'connections:query-account-balances',
  getAccountsViewPreferences: 'connections:get-accounts-view-preferences',
  updateAccountsViewPreferences: 'connections:update-accounts-view-preferences',
} as const;

export const IPC_CHANNELS = {
  ...SYSTEM_CHANNELS,
  ...CONNECTION_CHANNELS,
} as const;
