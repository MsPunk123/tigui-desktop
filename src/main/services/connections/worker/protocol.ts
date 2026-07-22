/**
 * Discriminated union types for TigerBeetle worker IPC messages.
 * Used by both the worker child process (via JSDoc) and the bridge.
 */

export type WorkerQueryAccountsFilter = {
  user_data_128: string;
  user_data_64: string;
  user_data_32: number;
  ledger: number;
  code: number;
  timestamp_min: string;
  timestamp_max: string;
  limit: number;
  flags: number;
};

export type WorkerAccountBalancesFilter = {
  account_id: string;
  user_data_128: string;
  user_data_64: string;
  user_data_32: number;
  code: number;
  timestamp_min: string;
  timestamp_max: string;
  limit: number;
  flags: number;
};

export type WorkerQueryAccountWire = {
  id: string;
  debits_pending: string;
  debits_posted: string;
  credits_pending: string;
  credits_posted: string;
  user_data_128: string;
  user_data_64: string;
  user_data_32: number;
  ledger: number;
  code: number;
  flags: number;
  timestamp: string;
};

export type WorkerAccountBalanceWire = {
  debits_pending: string;
  debits_posted: string;
  credits_pending: string;
  credits_posted: string;
  timestamp: string;
};

export type WorkerQueryAccount = {
  id: bigint;
  debits_pending: bigint;
  debits_posted: bigint;
  credits_pending: bigint;
  credits_posted: bigint;
  user_data_128: bigint;
  user_data_64: bigint;
  user_data_32: number;
  ledger: number;
  code: number;
  flags: number;
  timestamp: bigint;
};

export type WorkerAccountBalance = {
  debits_pending: bigint;
  debits_posted: bigint;
  credits_pending: bigint;
  credits_posted: bigint;
  timestamp: bigint;
};

export type CreateClientRequest = {
  type: 'create';
  id: number;
  clientId: string;
  clusterId: string;
  addresses: string[];
};

export type VerifyClientRequest = {
  type: 'verify';
  id: number;
  clientId: string;
};

export type QueryAccountsRequest = {
  type: 'queryAccounts';
  id: number;
  clientId: string;
  filter: WorkerQueryAccountsFilter;
};

export type GetAccountBalancesRequest = {
  type: 'getAccountBalances';
  id: number;
  clientId: string;
  filter: WorkerAccountBalancesFilter;
};

export type DestroyClientRequest = {
  type: 'destroy';
  id: number;
  clientId: string;
};

export type DestroyAllRequest = {
  type: 'destroyAll';
  id: number;
};

export type PingRequest = {
  type: 'ping';
  id: number;
};

export type WorkerRequest =
  | CreateClientRequest
  | VerifyClientRequest
  | QueryAccountsRequest
  | GetAccountBalancesRequest
  | DestroyClientRequest
  | DestroyAllRequest
  | PingRequest;

/** Distributive Omit that works on discriminated unions. */
export type WorkerRequestBody = {
  [K in WorkerRequest['type']]: Omit<Extract<WorkerRequest, { type: K }>, 'id'>;
}[WorkerRequest['type']];

export type WorkerSuccessResponse = {
  id: number;
  ok: true;
  result?: WorkerQueryAccountWire[] | WorkerAccountBalanceWire[];
};

export type WorkerErrorResponse = {
  id: number;
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

export interface ITigerBeetleWorker {
  createClient(clientId: string, clusterId: string, addresses: string[]): Promise<void>;
  verifyClient(clientId: string): Promise<void>;
  queryAccounts(clientId: string, filter: WorkerQueryAccountsFilter): Promise<WorkerQueryAccount[]>;
  getAccountBalances(
    clientId: string,
    filter: WorkerAccountBalancesFilter,
  ): Promise<WorkerAccountBalance[]>;
  destroyClient(clientId: string): Promise<void>;
  destroyAll(): Promise<void>;
  dispose(): void;
}
