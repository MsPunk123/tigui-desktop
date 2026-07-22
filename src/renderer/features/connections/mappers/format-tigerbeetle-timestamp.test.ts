import { describe, expect, it } from 'vitest';

import { formatTigerBeetleTimestamp } from './format-tigerbeetle-timestamp';

describe('formatTigerBeetleTimestamp', () => {
  it('formats epoch nanoseconds to human-readable UTC at millisecond precision', () => {
    const formatted = formatTigerBeetleTimestamp('1000');
    expect(formatted.displayUtc).toBe('1970-01-01 00:00:00.000 UTC');
    expect(formatted.isoUtc).toBe('1970-01-01T00:00:00.000Z');
    expect(formatted.rawNs).toBe('1000');
    expect(formatted.isValid).toBe(true);
  });

  it('formats large valid nanosecond timestamps', () => {
    const formatted = formatTigerBeetleTimestamp('253402300799999999999');
    expect(formatted.displayUtc).toContain('9999-12-31');
    expect(formatted.isoUtc).toBe('9999-12-31T23:59:59.999Z');
    expect(formatted.isValid).toBe(true);
  });

  it('falls back safely for invalid values', () => {
    const formatted = formatTigerBeetleTimestamp('not-a-number');
    expect(formatted.displayUtc).toBe('not-a-number');
    expect(formatted.isoUtc).toBe('Invalid timestamp');
    expect(formatted.isValid).toBe(false);
  });
});
