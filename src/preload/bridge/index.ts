import type { TiguiBridge } from '@/shared/ipc';

import { createConnectionsBridge } from './connections';
import { createSystemBridge } from './system';

export const createTiguiBridge = (): TiguiBridge => ({
  ...createSystemBridge(),
  ...createConnectionsBridge(),
});
