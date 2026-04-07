import dns from 'node:dns/promises';

import { cannotResolveHostname, invalidReplicaAddress } from './connection-errors';
import { parseAddresses } from './connection-validation';

/**
 * Normalizes and resolves replica addresses for TigerBeetle.
 * Validates format via parseAddresses, then resolves hostnames to IPv4
 * since the TigerBeetle native client only accepts IP addresses.
 */
export const resolveReplicaAddresses = async (addresses: string[]): Promise<string[]> => {
  const parsed = parseAddresses(addresses);

  if (parsed.invalid.length > 0 || parsed.normalized.length === 0) {
    throw new Error(
      invalidReplicaAddress(
        parsed.invalid.length > 0 ? parsed.invalid.join(', ') : 'none provided',
      ),
    );
  }

  return Promise.all(parsed.normalized.map(resolveToIP));
};

const resolveToIP = async (address: string): Promise<string> => {
  const colonIndex = address.lastIndexOf(':');
  const host = colonIndex > 0 ? address.substring(0, colonIndex) : address;
  const port = colonIndex > 0 ? address.substring(colonIndex + 1) : null;

  // Already an IPv4 address — pass through
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return address;
  }

  // Port-only address (no host) — pass through
  if (/^\d+$/.test(address)) {
    return address;
  }

  try {
    const { address: ip } = await dns.lookup(host, { family: 4 });
    return port ? `${ip}:${port}` : ip;
  } catch {
    throw new Error(cannotResolveHostname(host));
  }
};
