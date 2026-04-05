import { ipcRenderer } from 'electron';

import { SYSTEM_CHANNELS, type SystemBridge } from '@/shared/ipc';

export const createSystemBridge = (): SystemBridge => ({
  getAppVersion: () => ipcRenderer.invoke(SYSTEM_CHANNELS.getAppVersion),
  ping: (message) => ipcRenderer.invoke(SYSTEM_CHANNELS.ping, message),
});
