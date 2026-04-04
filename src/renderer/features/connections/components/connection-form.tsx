import { useMemo, useState } from 'react';

import { Button } from '@/renderer/shared/components/ui';

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

const baseInputClassName =
  'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring';

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
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="connection-name">
          Connection Name
        </label>
        <input
          id="connection-name"
          className={baseInputClassName}
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Production Cluster"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="cluster-id">
          Cluster ID
        </label>
        <input
          id="cluster-id"
          className={baseInputClassName}
          value={values.clusterId}
          onChange={(event) => setValues((prev) => ({ ...prev, clusterId: event.target.value }))}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Replica URLs</p>
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
            +
          </Button>
        </div>

        <div className="space-y-2">
          {values.replicaUrls.map((replicaUrl, index) => (
            <div key={index} className="space-y-1">
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  className={baseInputClassName}
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
              {replicaUrlErrors[index] ? (
                <p className="text-xs text-destructive">{replicaUrlErrors[index]}</p>
              ) : null}
            </div>
          ))}
        </div>
        {hasDuplicateReplicaUrls ? (
          <p className="text-xs text-destructive">
            Duplicate replica URLs are not allowed after normalization.
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Only `http://` or `https://` URLs are accepted, and each URL must include a host and port.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="environment-tag">
          Environment Tag (Optional)
        </label>
        <input
          id="environment-tag"
          className={baseInputClassName}
          value={values.environmentTag}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, environmentTag: event.target.value }))
          }
          placeholder="local / staging / prod"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Secrets (Optional)</p>
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
          <p className="text-xs text-muted-foreground">No secrets configured.</p>
        ) : (
          <div className="space-y-2">
            {values.secrets.map((secret, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input
                  className={baseInputClassName}
                  value={secret.key}
                  onChange={(event) => {
                    const next = [...values.secrets];
                    next[index] = { ...next[index], key: event.target.value };
                    setValues((prev) => ({ ...prev, secrets: next }));
                  }}
                  placeholder="api_key"
                />
                <input
                  className={baseInputClassName}
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
                    const next = values.secrets.filter((_, secretIndex) => secretIndex !== index);
                    setValues((prev) => ({ ...prev, secrets: next }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.setAsDefault}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              setAsDefault: event.target.checked,
            }))
          }
        />
        Set as default connection
      </label>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
