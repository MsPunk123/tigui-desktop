export type AccountFlagName =
  | 'linked'
  | 'debits_must_not_exceed_credits'
  | 'credits_must_not_exceed_debits'
  | 'history'
  | 'imported'
  | 'closed';

export type DecodedAccountFlags = {
  rawValue: number;
  activeFlags: AccountFlagName[];
  unknownBits: number;
  isNone: boolean;
};

type AccountFlagMeta = {
  bit: number;
  name: AccountFlagName;
  label: string;
  tooltip: string;
  hint: string;
};

const ACCOUNT_FLAG_META: AccountFlagMeta[] = [
  {
    bit: 1,
    name: 'linked',
    label: 'Linked',
    tooltip: 'Account creation may be linked atomically with adjacent events.',
    hint: 'Linked: account creation can participate in a linked chain.',
  },
  {
    bit: 2,
    name: 'debits_must_not_exceed_credits',
    label: 'Debits <= Credits',
    tooltip: 'Debits cannot exceed posted credits for this account.',
    hint: 'Debits are bounded by posted credits.',
  },
  {
    bit: 4,
    name: 'credits_must_not_exceed_debits',
    label: 'Credits <= Debits',
    tooltip: 'Credits cannot exceed posted debits for this account.',
    hint: 'Credits are bounded by posted debits.',
  },
  {
    bit: 8,
    name: 'history',
    label: 'History',
    tooltip: 'Historical balances are retained and available via get_account_balances.',
    hint: 'History enabled: get_account_balances can return historical balances.',
  },
  {
    bit: 16,
    name: 'imported',
    label: 'Imported',
    tooltip: 'This account was imported with explicit timestamp semantics.',
    hint: 'Imported: created as imported data in the event stream.',
  },
  {
    bit: 32,
    name: 'closed',
    label: 'Closed',
    tooltip: 'Closed accounts reject new transfer activity that posts additional balance movement.',
    hint: 'Closed: blocks new posting activity for this account.',
  },
];

const KNOWN_ACCOUNT_FLAGS_MASK = ACCOUNT_FLAG_META.reduce((mask, flag) => mask | flag.bit, 0);

export const decodeAccountFlags = (flags: number): DecodedAccountFlags => {
  const rawValue = Number.isInteger(flags) && flags >= 0 ? flags : 0;
  const activeFlags = ACCOUNT_FLAG_META.filter((flag) => (rawValue & flag.bit) === flag.bit).map(
    (flag) => flag.name,
  );

  return {
    rawValue,
    activeFlags,
    unknownBits: rawValue & ~KNOWN_ACCOUNT_FLAGS_MASK,
    isNone: rawValue === 0,
  };
};

export const getAccountFlagMeta = (name: AccountFlagName): AccountFlagMeta => {
  const found = ACCOUNT_FLAG_META.find((item) => item.name === name);
  if (!found) {
    throw new Error(`Unknown account flag: ${name}`);
  }
  return found;
};
