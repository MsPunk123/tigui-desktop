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
  replicaUrls: string[];
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

const normalizeReplicaUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname || !parsed.port) {
      return null;
    }

    return `${parsed.protocol}//${parsed.hostname}:${parsed.port}`;
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

  const replicaUrlErrors = useMemo(() => {
    return values.replicaUrls.map((item) => {
      const trimmed = item.trim();
      if (!trimmed) {
        return 'Replica URL is required.';
      }

      if (!normalizeReplicaUrl(trimmed)) {
        return 'Use a valid http:// or https:// URL with explicit host and port.';
      }

      return null;
    });
  }, [values.replicaUrls]);

  const hasDuplicateReplicaUrls = useMemo(() => {
    const normalized = values.replicaUrls
      .map((item) => normalizeReplicaUrl(item))
      .filter((item): item is string => Boolean(item));
    return new Set(normalized).size !== normalized.length;
  }, [values.replicaUrls]);

  const canSubmit = useMemo(() => {
    const hasReplicaErrors = replicaUrlErrors.some(Boolean);
    return (
      values.name.trim().length >= 2 &&
      values.clusterId.trim().length > 0 &&
      values.replicaUrls.length > 0 &&
      !hasReplicaErrors &&
      !hasDuplicateReplicaUrls
    );
  }, [
    hasDuplicateReplicaUrls,
    replicaUrlErrors,
    values.clusterId,
    values.name,
    values.replicaUrls.length,
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
              <FieldLabel>Replica URLs</FieldLabel>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    replicaUrls: [...prev.replicaUrls, ''],
                  }))
                }
              >
                Add URL
              </Button>
            </div>

            <FieldGroup className="gap-2">
              {values.replicaUrls.map((replicaUrl, index) => (
                <Field key={index}>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <Input
                      aria-invalid={replicaUrlErrors[index] ? true : undefined}
                      value={replicaUrl}
                      onChange={(event) => {
                        const next = [...values.replicaUrls];
                        next[index] = event.target.value;
                        setValues((prev) => ({ ...prev, replicaUrls: next }));
                      }}
                      placeholder="http://127.0.0.1:3001"
                    />
                    {values.replicaUrls.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            replicaUrls: prev.replicaUrls.filter((_, row) => row !== index),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <FieldError>{replicaUrlErrors[index]}</FieldError>
                </Field>
              ))}
            </FieldGroup>

            <FieldError>
              {hasDuplicateReplicaUrls
                ? 'Duplicate replica URLs are not allowed after normalization.'
                : null}
            </FieldError>
            <FieldDescription>
              Only `http://` or `https://` URLs are accepted, and each URL must include a host and
              port.
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
                        variant="ghost"
                        onClick={() => {
                          const next = values.secrets.filter(
                            (_, secretIndex) => secretIndex !== index,
                          );
                          setValues((prev) => ({ ...prev, secrets: next }));
                        }}
                      >
                        Remove
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
