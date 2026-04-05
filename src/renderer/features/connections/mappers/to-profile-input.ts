import type { ConnectionProfile, ConnectionProfileInput } from '@/shared/connections';

import type { ConnectionFormValues } from '../components/connection-form';

export const EMPTY_CONNECTION_FORM: ConnectionFormValues = {
  name: '',
  clusterId: '',
  replicaUrls: [''],
  environmentTag: '',
  setAsDefault: false,
  secrets: [],
};

export const toProfileInput = (values: ConnectionFormValues): ConnectionProfileInput => {
  const addresses = values.replicaUrls.map((value) => value.trim()).filter(Boolean);
  const secrets = Object.fromEntries(
    values.secrets
      .map((item) => [item.key.trim(), item.value])
      .filter(([key, value]) => key.length > 0 && value.trim().length > 0),
  );

  return {
    name: values.name,
    clusterId: values.clusterId,
    addresses,
    environmentTag: values.environmentTag,
    setAsDefault: values.setAsDefault,
    secrets,
  };
};

export const toConnectionFormValues = (profile: ConnectionProfile): ConnectionFormValues => ({
  name: profile.name,
  clusterId: profile.clusterId,
  replicaUrls: profile.addresses.length > 0 ? [...profile.addresses] : [''],
  environmentTag: profile.environmentTag ?? '',
  setAsDefault: profile.isDefault,
  secrets: [],
});
