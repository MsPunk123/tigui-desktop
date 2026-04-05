import { Button } from '@/renderer/shared/components/ui';
import type { ConnectionProfile } from '@/shared/connections';

type ConnectionListProps = {
  profiles: ConnectionProfile[];
  connectedConnectionIds: string[];
  onConnect: (profile: ConnectionProfile) => void;
  onTest: (profile: ConnectionProfile) => void;
  onEdit: (profile: ConnectionProfile) => void;
  onDelete: (profile: ConnectionProfile) => void;
};

export const ConnectionList = ({
  profiles,
  connectedConnectionIds,
  onConnect,
  onTest,
  onEdit,
  onDelete,
}: ConnectionListProps) => {
  return (
    <section className="space-y-3">
      {profiles.map((profile) => (
        <article key={profile.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{profile.name}</h3>
                {profile.isDefault ? (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    default
                  </span>
                ) : null}
                {connectedConnectionIds.includes(profile.id) ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    connected
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Cluster {profile.clusterId}
                {profile.environmentTag ? ` - ${profile.environmentTag}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">{profile.addresses.join(', ')}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!connectedConnectionIds.includes(profile.id) ? (
                <Button variant="outline" onClick={() => onConnect(profile)}>
                  Connect
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => onTest(profile)}>
                Test
              </Button>
              <Button variant="outline" onClick={() => onEdit(profile)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => onDelete(profile)}>
                Delete
              </Button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
};
