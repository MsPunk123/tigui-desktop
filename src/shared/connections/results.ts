import type {
  AccountBalancesResult,
  AccountsPageResult,
  ConnectionProfile,
  ConnectionValidationError,
} from './types';

export type ConnectionOperationResult =
  | {
      ok: true;
      profile: ConnectionProfile;
    }
  | {
      ok: false;
      message: string;
      validationErrors?: ConnectionValidationError[];
    };

export type QueryConnectedAccountsResult =
  | {
      ok: true;
      page: AccountsPageResult;
    }
  | {
      ok: false;
      code: 'connection_not_found' | 'connection_not_connected' | 'query_failed';
      message: string;
    };

export type QueryConnectedAccountBalancesResult =
  | {
      ok: true;
      balances: AccountBalancesResult;
    }
  | {
      ok: false;
      code:
        | 'connection_not_found'
        | 'connection_not_connected'
        | 'query_failed'
        | 'invalid_account_id';
      message: string;
    };
