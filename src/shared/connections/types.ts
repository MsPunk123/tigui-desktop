export type ConnectionProfile = {
  id: string;
  name: string;
  clusterId: string;
  addresses: string[];
  environmentTag?: string;
  isDefault: boolean;
  isConnected: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionProfileInput = {
  name: string;
  clusterId: string;
  addresses: string[];
  environmentTag?: string;
  setAsDefault?: boolean;
  secrets?: Record<string, string>;
};

export type ConnectionValidationError = {
  field: 'name' | 'clusterId' | 'addresses' | 'environmentTag' | 'secrets';
  message: string;
};

export type ConnectionTestResult = {
  passed: boolean;
  testedAt: string;
  message: string;
  addressResults: Array<{
    address: string;
    reachable: boolean;
    message: string;
  }>;
};

export type AccountRecordDto = {
  id: string;
  debitsPending: string;
  debitsPosted: string;
  creditsPending: string;
  creditsPosted: string;
  userData128: string;
  userData64: string;
  userData32: number;
  ledger: number;
  code: number;
  flags: number;
  timestamp: string;
};

export type AccountsPageRequest = {
  limit?: number;
  cursorTimestampMax?: string;
  query?: AccountsQueryRequest;
};

export type AccountsPageResult = {
  items: AccountRecordDto[];
  nextCursorTimestampMax?: string;
};

export type AccountsQueryRequest = {
  ledger?: number;
  code?: number;
  userData128?: string;
  userData64?: string;
  userData32?: number;
  timestampMin?: string;
  timestampMax?: string;
  sort?: 'asc' | 'desc';
};

export type AccountsQueryState = {
  ledger: string;
  code: string;
  userData128: string;
  userData64: string;
  userData32: string;
  timestampMin: string;
  timestampMax: string;
  sort: 'asc' | 'desc';
};

export type AccountBalancePointDto = {
  debitsPending: string;
  debitsPosted: string;
  creditsPending: string;
  creditsPosted: string;
  timestamp: string;
};

export type AccountBalancesRequest = {
  accountId: string;
  limit?: number;
  cursorTimestampMax?: string;
  sort?: 'asc' | 'desc';
};

export type AccountBalancesResult = {
  items: AccountBalancePointDto[];
  nextCursorTimestampMax?: string;
};

export type AccountsViewPreferences = {
  showAllDetailsInRows: boolean;
  showRawDetailsPanel: boolean;
  tColumnsEnabled: boolean;
  debitCreditColorMode: 'semantic_fixed';
  accountsQueryState: AccountsQueryState;
};
