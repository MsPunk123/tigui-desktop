import type { ConnectionProfileInput, ConnectionValidationError } from '@/shared/connections';

import type { ParsedAddresses, StoredConnectionProfile } from './connection-models';

export const parseAddresses = (addresses: string[]): ParsedAddresses => {
  const normalized: string[] = [];
  const invalid: string[] = [];

  for (const rawAddress of addresses) {
    const trimmed = rawAddress.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = normalizeAddress(trimmed);
    if (!parsed) {
      invalid.push(trimmed);
      continue;
    }

    normalized.push(parsed);
  }

  return { normalized, invalid };
};

export const normalizeAddress = (input: string): string | null => {
  const value = input.trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    if (!url.hostname || !url.port) {
      return null;
    }

    const port = Number(url.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return null;
    }

    return `${url.protocol}//${url.hostname}:${url.port}`;
  } catch {
    return null;
  }
};

export const normalizeOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const validateProfileInput = (
  input: ConnectionProfileInput,
  existingProfiles: StoredConnectionProfile[],
): ConnectionValidationError[] => {
  const errors: ConnectionValidationError[] = [];

  const name = input.name.trim();
  if (name.length < 2) {
    errors.push({ field: 'name', message: 'Name must have at least 2 characters.' });
  }

  const duplicateName = existingProfiles.some(
    (profile) => profile.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicateName) {
    errors.push({ field: 'name', message: 'Name must be unique.' });
  }

  const clusterId = input.clusterId.trim();
  if (!/^\d+$/.test(clusterId)) {
    errors.push({ field: 'clusterId', message: 'Cluster ID must be numeric.' });
  }

  const parsedAddresses = parseAddresses(input.addresses);
  if (parsedAddresses.normalized.length === 0) {
    errors.push({ field: 'addresses', message: 'At least one address is required.' });
  }

  if (parsedAddresses.invalid.length > 0) {
    errors.push({
      field: 'addresses',
      message: `Invalid replica URL: ${parsedAddresses.invalid.join(', ')}. Use http:// or https:// with host and port.`,
    });
  }

  const hasDuplicates =
    new Set(parsedAddresses.normalized).size !== parsedAddresses.normalized.length;
  if (hasDuplicates) {
    errors.push({ field: 'addresses', message: 'Duplicate addresses are not allowed.' });
  }

  if (input.secrets) {
    const hasInvalidSecretKey = Object.keys(input.secrets).some((key) => key.trim().length === 0);
    if (hasInvalidSecretKey) {
      errors.push({
        field: 'secrets',
        message: 'Secret keys cannot be empty.',
      });
    }
  }

  return errors;
};
