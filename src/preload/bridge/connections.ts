import { ipcRenderer } from 'electron';

import { CONNECTION_CHANNELS, type ConnectionsBridge } from '@/shared/ipc';

export const createConnectionsBridge = (): ConnectionsBridge => ({
  listConnections: () => ipcRenderer.invoke(CONNECTION_CHANNELS.listConnections),
  createConnection: (input) => ipcRenderer.invoke(CONNECTION_CHANNELS.createConnection, input),
  updateConnection: (id, input) =>
    ipcRenderer.invoke(CONNECTION_CHANNELS.updateConnection, id, input),
  deleteConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.deleteConnection, id),
  connectConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.connectConnection, id),
  disconnectConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.disconnectConnection, id),
  getConnectedConnectionIds: () =>
    ipcRenderer.invoke(CONNECTION_CHANNELS.getConnectedConnectionIds),
  testConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.testConnection, id),
});
