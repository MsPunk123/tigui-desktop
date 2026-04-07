import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
} from '@/renderer/shared/components/ui';

export type ConnectionFormValues = {
  name: string;
  clusterId: string;
  replicaAddresses: string[];
  environmentTag: string;
  setAsDefault: boolean;
  secrets: Array<{ key: string; value: string }>;
};

type ConnectionFormProps = {
  initialValues: ConnectionFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: ConnectionFormValues) => void;
  isSubmitting?: boolean;
};

const emptySecret = () => ({ key: '', value: '' });

const normalizeReplicaAddress = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const port = Number(trimmed);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? String(port) : null;
  }

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `tb://${trimmed}`);
    if (!parsed.hostname) {
      return null;
    }

    const port = parsed.port ? Number(parsed.port) : null;
    if (port !== null && (!Number.isInteger(port) || port < 1 || port > 65535)) {
      return null;
    }

    if (parsed.port) {
      return `${parsed.hostname.toLowerCase()}:${parsed.port}`;
    }

    if (trimmed.includes('://')) {
      return `${parsed.hostname.toLowerCase()}:3001`;
    }

    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
};

export const ConnectionForm = ({
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: ConnectionFormProps) => {
  const [values, setValues] = useState<ConnectionFormValues>(initialValues);
  const secretCheckboxId = 'connection-set-default';

  const replicaAddressErrors = useMemo(() => {
    return values.replicaAddresses.map((item) => {
      const trimmed = item.trim();
      if (!trimmed) {
        return 'Replica address is required.';
      }

      if (!normalizeReplicaAddress(trimmed)) {
        return 'Use a valid replica address like 127.0.0.1:3001 or 3001.';
      }

      return null;
    });
  }, [values.replicaAddresses]);

  const hasDuplicateReplicaAddresses = useMemo(() => {
    const normalized = values.replicaAddresses
      .map((item) => normalizeReplicaAddress(item))
      .filter((item): item is string => Boolean(item));
    return new Set(normalized).size !== normalized.length;
  }, [values.replicaAddresses]);

  const canSubmit = useMemo(() => {
    const hasReplicaErrors = replicaAddressErrors.some(Boolean);
    return (
      values.name.trim().length >= 2 &&
      values.clusterId.trim().length > 0 &&
      values.replicaAddresses.length > 0 &&
      !hasReplicaErrors &&
      !hasDuplicateReplicaAddresses
    );
  }, [
    hasDuplicateReplicaAddresses,
    replicaAddressErrors,
    values.clusterId,
    values.name,
    values.replicaAddresses.length,
  ]);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel htmlFor="connection-name">Connection Name</FieldLabel>
            <Input
              id="connection-name"
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Production Cluster"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="cluster-id">Cluster ID</FieldLabel>
            <Input
              id="cluster-id"
              value={values.clusterId}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, clusterId: event.target.value }))
              }
              placeholder="0"
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel>Replica Addresses</FieldLabel>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    replicaAddresses: [...prev.replicaAddresses, ''],
                  }))
                }
              >
                Add Address
              </Button>
            </div>

            <FieldGroup className="gap-2">
              {values.replicaAddresses.map((replicaAddress, index) => (
                <Field key={index}>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <Input
                      aria-invalid={replicaAddressErrors[index] ? true : undefined}
                      value={replicaAddress}
                      onChange={(event) => {
                        const next = [...values.replicaAddresses];
                        next[index] = event.target.value;
                        setValues((prev) => ({ ...prev, replicaAddresses: next }));
                      }}
                      placeholder="127.0.0.1:3001"
                    />
                    {values.replicaAddresses.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Remove"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            replicaAddresses: prev.replicaAddresses.filter(
                              (_, row) => row !== index,
                            ),
                          }))
                        }
                      >
                        <X />
                      </Button>
                    ) : null}
                  </div>
                  <FieldError>{replicaAddressErrors[index]}</FieldError>
                </Field>
              ))}
            </FieldGroup>

            <FieldError>
              {hasDuplicateReplicaAddresses
                ? 'Duplicate replica addresses are not allowed after normalization.'
                : null}
            </FieldError>
            <FieldDescription>
              Use TigerBeetle replica addresses like `127.0.0.1:3001` or `3001`.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="environment-tag">Environment Tag (Optional)</FieldLabel>
            <Input
              id="environment-tag"
              value={values.environmentTag}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, environmentTag: event.target.value }))
              }
              placeholder="local / staging / prod"
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel>Secrets (Optional)</FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    secrets: [...prev.secrets, emptySecret()],
                  }))
                }
              >
                Add Secret
              </Button>
            </div>

            {values.secrets.length === 0 ? (
              <FieldDescription>No secrets configured.</FieldDescription>
            ) : (
              <FieldGroup className="gap-2">
                {values.secrets.map((secret, index) => (
                  <Field key={index}>
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Input
                        value={secret.key}
                        onChange={(event) => {
                          const next = [...values.secrets];
                          next[index] = { ...next[index], key: event.target.value };
                          setValues((prev) => ({ ...prev, secrets: next }));
                        }}
                        placeholder="api_key"
                      />
                      <Input
                        value={secret.value}
                        type="password"
                        onChange={(event) => {
                          const next = [...values.secrets];
                          next[index] = { ...next[index], value: event.target.value };
                          setValues((prev) => ({ ...prev, secrets: next }));
                        }}
                        placeholder="value"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => {
                          const next = values.secrets.filter(
                            (_, secretIndex) => secretIndex !== index,
                          );
                          setValues((prev) => ({ ...prev, secrets: next }));
                        }}
                      >
                        <X />
                      </Button>
                    </div>
                  </Field>
                ))}
              </FieldGroup>
            )}
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id={secretCheckboxId}
              checked={values.setAsDefault}
              onCheckedChange={(checked) =>
                setValues((prev) => ({
                  ...prev,
                  setAsDefault: checked === true,
                }))
              }
            />
            <FieldContent>
              <FieldLabel htmlFor={secretCheckboxId}>Set as default connection</FieldLabel>
              <FieldDescription>
                This connection will be preferred when a default target is needed.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field orientation="horizontal" className="pt-1">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </Field>
        </FieldSet>
      </FieldGroup>
    </form>
  );
};
