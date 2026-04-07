import type {
  ConnectionOperationResult,
  ConnectionProfile,
  ConnectionProfileInput,
  ConnectionTestResult,
} from '@/shared/connections';

export type SystemBridge = {
  getAppVersion: () => Promise<string>;
  ping: (message: string) => Promise<string>;
};

export type ConnectionsBridge = {
  listConnections: () => Promise<ConnectionProfile[]>;
  createConnection: (input: ConnectionProfileInput) => Promise<ConnectionOperationResult>;
  updateConnection: (
    id: string,
    input: ConnectionProfileInput,
  ) => Promise<ConnectionOperationResult>;
  deleteConnection: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  connectConnection: (
    id: string,
  ) => Promise<{ ok: true; connectedConnectionIds: string[] } | { ok: false; message: string }>;
  disconnectConnection: (
    id: string,
  ) => Promise<{ ok: true; connectedConnectionIds: string[] } | { ok: false; message: string }>;
  getConnectedConnectionIds: () => Promise<string[]>;
  testConnection: (
    id: string,
  ) => Promise<{ ok: true; result: ConnectionTestResult } | { ok: false; message: string }>;
};

export type TiguiBridge = SystemBridge & ConnectionsBridge;
