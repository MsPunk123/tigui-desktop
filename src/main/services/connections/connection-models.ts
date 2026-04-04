import type { ConnectionProfile } from '@/shared/connections';

export type StoredConnectionProfile = Omit<ConnectionProfile, 'isActive'>;

export type ConnectionStateFile = {
  profiles: StoredConnectionProfile[];
  activeConnectionId: string | null;
};

export type SecretsFile = Record<string, Record<string, string>>;

export type ParsedAddresses = {
  normalized: string[];
  invalid: string[];
};

export const DEFAULT_STATE: ConnectionStateFile = {
  profiles: [],
  activeConnectionId: null,
};

export const CONNECTION_TIMEOUT_MS = 1_500;
