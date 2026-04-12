// Centralized error messages for the connections service layer.

export const CONNECTION_NOT_FOUND = 'Connection was not found.';
export const CONNECTION_NOT_CONNECTED = 'Connection is not connected.';
export const PROFILE_INVALID = 'Connection profile is invalid.';
export const VERIFY_TIMEOUT = 'Timed out while waiting for TigerBeetle to respond.';
export const VERIFY_FAILED = 'TigerBeetle client verification failed.';
export const QUERY_ACCOUNTS_FAILED = 'Failed to query accounts from TigerBeetle.';
export const VERIFY_SUCCEEDED = 'TigerBeetle client verification succeeded.';
export const VERIFY_ADDRESS_OK = 'Verified through TigerBeetle client.';

export const invalidReplicaAddress = (details: string): string =>
  `Invalid replica address: ${details}.`;

export const cannotResolveHostname = (hostname: string): string =>
  `Cannot resolve hostname '${hostname}' to an IP address.`;
