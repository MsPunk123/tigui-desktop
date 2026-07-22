import { describe, expect, it } from 'vitest';

import { decodeAccountFlags } from './account-flags';

describe('decodeAccountFlags', () => {
  it('decodes each known single-bit flag', () => {
    expect(decodeAccountFlags(1).activeFlags).toEqual(['linked']);
    expect(decodeAccountFlags(2).activeFlags).toEqual(['debits_must_not_exceed_credits']);
    expect(decodeAccountFlags(4).activeFlags).toEqual(['credits_must_not_exceed_debits']);
    expect(decodeAccountFlags(8).activeFlags).toEqual(['history']);
    expect(decodeAccountFlags(16).activeFlags).toEqual(['imported']);
    expect(decodeAccountFlags(32).activeFlags).toEqual(['closed']);
  });

  it('decodes combined flags with stable order', () => {
    const decoded = decodeAccountFlags(10);
    expect(decoded.activeFlags).toEqual(['debits_must_not_exceed_credits', 'history']);
    expect(decoded.isNone).toBe(false);
  });

  it('keeps none and unknown bits non-breaking', () => {
    const none = decodeAccountFlags(0);
    expect(none.activeFlags).toEqual([]);
    expect(none.isNone).toBe(true);
    expect(none.unknownBits).toBe(0);

    const unknown = decodeAccountFlags(64);
    expect(unknown.activeFlags).toEqual([]);
    expect(unknown.unknownBits).toBe(64);
    expect(unknown.isNone).toBe(false);
  });
});
