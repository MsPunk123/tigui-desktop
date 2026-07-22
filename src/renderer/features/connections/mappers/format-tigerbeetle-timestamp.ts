export type FormattedTigerBeetleTimestamp = {
  displayUtc: string;
  isoUtc: string;
  rawNs: string;
  isValid: boolean;
};

const NANOS_PER_MILLISECOND = 1_000_000n;

export const formatTigerBeetleTimestamp = (rawNs: string): FormattedTigerBeetleTimestamp => {
  const trimmed = rawNs.trim();
  if (!/^\d+$/.test(trimmed)) {
    return {
      displayUtc: rawNs,
      isoUtc: 'Invalid timestamp',
      rawNs,
      isValid: false,
    };
  }

  try {
    const nanos = BigInt(trimmed);
    const epochMsBigInt = nanos / NANOS_PER_MILLISECOND;
    if (epochMsBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
      return {
        displayUtc: rawNs,
        isoUtc: 'Invalid timestamp',
        rawNs,
        isValid: false,
      };
    }

    const epochMs = Number(epochMsBigInt);
    const date = new Date(epochMs);
    if (Number.isNaN(date.getTime())) {
      return {
        displayUtc: rawNs,
        isoUtc: 'Invalid timestamp',
        rawNs,
        isValid: false,
      };
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    return {
      displayUtc: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} UTC`,
      isoUtc: date.toISOString(),
      rawNs,
      isValid: true,
    };
  } catch {
    return {
      displayUtc: rawNs,
      isoUtc: 'Invalid timestamp',
      rawNs,
      isValid: false,
    };
  }
};
