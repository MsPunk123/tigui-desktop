import type { ConnectionProfile } from '@/shared/connections';

export type StoredConnectionProfile = Omit<ConnectionProfile, 'isConnected'>;

export type ConnectionStateFile = {
  profiles: StoredConnectionProfile[];
};

export type SecretsFile = Record<string, Record<string, string>>;

export type ParsedAddresses = {
  normalized: string[];
  invalid: string[];
};

export const DEFAULT_STATE: ConnectionStateFile = {
  profiles: [],
};

export const CONNECTION_VERIFY_TIMEOUT_MS = 3_000;
