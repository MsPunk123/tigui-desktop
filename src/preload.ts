import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS, type TiguiBridge } from './shared/ipc';

const tiguiBridge: TiguiBridge = {
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.getAppVersion),
  ping: (message) => ipcRenderer.invoke(IPC_CHANNELS.ping, message),
};

contextBridge.exposeInMainWorld('tigui', tiguiBridge);
