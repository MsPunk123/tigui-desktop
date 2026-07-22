import { describe, expect, it } from 'vitest';

import { parseAddresses, validateProfileInput } from './connection-validation';

describe('connection-validation', () => {
  it('accepts host:port and port-only TigerBeetle addresses', () => {
    expect(parseAddresses(['127.0.0.1:3001', '3002']).normalized).toEqual([
      '127.0.0.1:3001',
      '3002',
    ]);
  });

  it('migrates legacy http addresses to TigerBeetle client format', () => {
    expect(parseAddresses(['http://127.0.0.1:3001', 'https://localhost:3002']).normalized).toEqual([
      '127.0.0.1:3001',
      'localhost:3002',
    ]);
  });

  it('rejects malformed addresses', () => {
    expect(parseAddresses(['invalid address']).invalid).toEqual(['invalid address']);
  });

  it('rejects duplicate addresses after normalization', () => {
    const errors = validateProfileInput(
      {
        name: 'Primary Cluster',
        clusterId: '0',
        addresses: ['127.0.0.1:3001', 'http://127.0.0.1:3001'],
      },
      [],
    );

    expect(errors).toContainEqual({
      field: 'addresses',
      message: 'Duplicate addresses are not allowed.',
    });
  });
});
