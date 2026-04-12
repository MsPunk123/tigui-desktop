import { ipcMain } from 'electron';

import { CONNECTION_CHANNELS } from '@/shared/ipc';

import { ConnectionStore } from '../../services/connections/connection-store';

export const registerConnectionHandlers = (connectionStore: ConnectionStore): void => {
  ipcMain.handle(CONNECTION_CHANNELS.listConnections, () => connectionStore.listConnections());
  ipcMain.handle(CONNECTION_CHANNELS.getConnectedConnectionIds, () =>
    connectionStore.getConnectedConnectionIds(),
  );
  ipcMain.handle(CONNECTION_CHANNELS.createConnection, (_event, input) =>
    connectionStore.createConnection(input),
  );
  ipcMain.handle(CONNECTION_CHANNELS.updateConnection, (_event, id, input) =>
    connectionStore.updateConnection(id, input),
  );
  ipcMain.handle(CONNECTION_CHANNELS.deleteConnection, (_event, id) =>
    connectionStore.deleteConnection(id),
  );
  ipcMain.handle(CONNECTION_CHANNELS.connectConnection, (_event, id) =>
    connectionStore.connectConnection(id),
  );
  ipcMain.handle(CONNECTION_CHANNELS.disconnectConnection, (_event, id) =>
    connectionStore.disconnectConnection(id),
  );
  ipcMain.handle(CONNECTION_CHANNELS.testConnection, (_event, id) =>
    connectionStore.testConnection(id),
  );
  ipcMain.handle(CONNECTION_CHANNELS.queryAccounts, (_event, id, request) =>
    connectionStore.queryConnectedAccounts(id, request),
  );
  ipcMain.handle(CONNECTION_CHANNELS.queryAccountBalances, (_event, id, request) =>
    connectionStore.queryConnectedAccountBalances(id, request),
  );
  ipcMain.handle(CONNECTION_CHANNELS.getAccountsViewPreferences, (_event, id) =>
    connectionStore.getAccountsViewPreferences(id),
  );
  ipcMain.handle(CONNECTION_CHANNELS.updateAccountsViewPreferences, (_event, id, patch) =>
    connectionStore.updateAccountsViewPreferences(id, patch),
  );
};
