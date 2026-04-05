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
