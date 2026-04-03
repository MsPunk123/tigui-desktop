import type { TiguiBridge } from '../shared/ipc';

declare global {
  interface Window {
    tigui: TiguiBridge;
  }
}

export {};
