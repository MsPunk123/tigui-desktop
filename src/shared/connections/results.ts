import type { ConnectionProfile, ConnectionValidationError } from './types';

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
