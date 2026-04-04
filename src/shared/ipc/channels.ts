export const SYSTEM_CHANNELS = {
  getAppVersion: 'app:get-version',
  ping: 'system:ping',
} as const;

export const CONNECTION_CHANNELS = {
  listConnections: 'connections:list',
  createConnection: 'connections:create',
  updateConnection: 'connections:update',
  deleteConnection: 'connections:delete',
  activateConnection: 'connections:activate',
  getActiveConnection: 'connections:get-active',
  testConnection: 'connections:test',
} as const;

export const IPC_CHANNELS = {
  ...SYSTEM_CHANNELS,
  ...CONNECTION_CHANNELS,
} as const;
