const NANOS_PER_MILLISECOND = 1_000_000n;

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

export const epochNsToDatetimeLocalUtc = (rawNs?: string): string => {
  if (!rawNs) {
    return '';
  }
  const trimmed = rawNs.trim();
  if (!/^\d+$/.test(trimmed)) {
    return '';
  }

  try {
    const nanos = BigInt(trimmed);
    const epochMsBigInt = nanos / NANOS_PER_MILLISECOND;
    if (epochMsBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
      return '';
    }
    const date = new Date(Number(epochMsBigInt));
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return [
      `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
      'T',
      `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${pad(
        date.getUTCMilliseconds(),
        3,
      )}`,
    ].join('');
  } catch {
    return '';
  }
};

export const datetimeLocalUtcToEpochNs = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
    trimmed,
  );
  if (!match) {
    return undefined;
  }

  const [, y, m, d, hh, mm, ss = '0', msec = '0'] = match;
  const milliseconds = Number(msec.padEnd(3, '0'));
  const epochMs = Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
    milliseconds,
  );

  if (!Number.isFinite(epochMs)) {
    return undefined;
  }

  return (BigInt(epochMs) * NANOS_PER_MILLISECOND).toString();
};
