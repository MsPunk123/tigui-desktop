import { app, ipcMain } from 'electron';

import { SYSTEM_CHANNELS } from '@/shared/ipc';

export const registerSystemHandlers = (): void => {
  ipcMain.handle(SYSTEM_CHANNELS.getAppVersion, () => app.getVersion());
  ipcMain.handle(SYSTEM_CHANNELS.ping, (_event, message: string) => `pong:${message}`);
};
