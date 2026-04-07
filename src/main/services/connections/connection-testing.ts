import type { ConnectionTestResult } from '@/shared/connections';

import { VERIFY_ADDRESS_OK, VERIFY_FAILED, VERIFY_SUCCEEDED } from './connection-errors';
import type { StoredConnectionProfile } from './connection-models';
import { TigerBeetleClientManager } from './tigerbeetle-client-manager';

export class ConnectionTester {
  constructor(private readonly clientManager: TigerBeetleClientManager) {}

  async testConnection(profile: StoredConnectionProfile): Promise<ConnectionTestResult> {
    try {
      await this.clientManager.test(profile.clusterId, profile.addresses);
      return {
        passed: true,
        testedAt: new Date().toISOString(),
        message: VERIFY_SUCCEEDED,
        addressResults: profile.addresses.map((address) => ({
          address,
          reachable: true,
          message: VERIFY_ADDRESS_OK,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : VERIFY_FAILED;

      return {
        passed: false,
        testedAt: new Date().toISOString(),
        message,
        addressResults: profile.addresses.map((address) => ({
          address,
          reachable: false,
          message,
        })),
      };
    }
  }
}
