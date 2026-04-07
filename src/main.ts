import path from 'node:path';

import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';

import { registerConnectionHandlers } from './main/ipc/connections/register-connection-handlers';
import { registerSystemHandlers } from './main/ipc/system/register-system-handlers';
import { ConnectionStore } from './main/services/connections/connection-store';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

process.on('uncaughtException', (error) => {
  console.error('[main] uncaughtException:', error);
});
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection:', reason);
});

const isDevelopment = Boolean(MAIN_WINDOW_VITE_DEV_SERVER_URL);
const connectionStore = new ConnectionStore(app.getPath('userData'));

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDevelopment,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.on('ready-to-show', () => mainWindow.show());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

registerSystemHandlers();
registerConnectionHandlers(connectionStore);

app.on('ready', () => {
  console.log('[main] app ready, creating window.');
  createWindow();
});
app.on('before-quit', () => {
  console.log('[main] before-quit');
  connectionStore.dispose();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
