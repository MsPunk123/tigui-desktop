import { ipcRenderer } from 'electron';

import { CONNECTION_CHANNELS, type ConnectionsBridge } from '@/shared/ipc';

export const createConnectionsBridge = (): ConnectionsBridge => ({
  listConnections: () => ipcRenderer.invoke(CONNECTION_CHANNELS.listConnections),
  createConnection: (input) => ipcRenderer.invoke(CONNECTION_CHANNELS.createConnection, input),
  updateConnection: (id, input) =>
    ipcRenderer.invoke(CONNECTION_CHANNELS.updateConnection, id, input),
  deleteConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.deleteConnection, id),
  activateConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.activateConnection, id),
  getActiveConnection: () => ipcRenderer.invoke(CONNECTION_CHANNELS.getActiveConnection),
  testConnection: (id) => ipcRenderer.invoke(CONNECTION_CHANNELS.testConnection, id),
});
