import { contextBridge } from 'electron';

import { createTiguiBridge } from './preload/bridge';

contextBridge.exposeInMainWorld('tigui', createTiguiBridge());
