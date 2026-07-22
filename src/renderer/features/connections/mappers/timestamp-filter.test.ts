import { describe, expect, it } from 'vitest';

import { datetimeLocalUtcToEpochNs, epochNsToDatetimeLocalUtc } from './timestamp-filter';

describe('timestamp-filter mappers', () => {
  it('maps epoch ns to datetime-local UTC', () => {
    expect(epochNsToDatetimeLocalUtc('1000000000')).toBe('1970-01-01T00:00:01.000');
  });

  it('maps datetime-local UTC to epoch ns', () => {
    expect(datetimeLocalUtcToEpochNs('1970-01-01T00:00:01.000')).toBe('1000000000');
    expect(datetimeLocalUtcToEpochNs('1970-01-01T00:00')).toBe('0');
  });

  it('fails safely for invalid values', () => {
    expect(epochNsToDatetimeLocalUtc('abc')).toBe('');
    expect(datetimeLocalUtcToEpochNs('invalid')).toBeUndefined();
    expect(datetimeLocalUtcToEpochNs('')).toBeUndefined();
  });
});
