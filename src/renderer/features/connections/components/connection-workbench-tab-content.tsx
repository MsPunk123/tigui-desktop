import { CheckCircle2, Pencil, Play, PlugZap, Server, Trash2 } from 'lucide-react';

import { useConnectionsModuleContext } from '@/renderer/app/modules/connections/connections-module-provider';
import { useWorkbench } from '@/renderer/app/workbench';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/renderer/shared/components/ui';

type ConnectionWorkbenchTabContentProps = {
  connectionId: string;
};

export const ConnectionWorkbenchTabContent = ({
  connectionId,
}: ConnectionWorkbenchTabContentProps) => {
  const {
    profiles,
    connectConnection,
    disconnectConnection,
    testConnection,
    openEdit,
    deleteConnection,
  } = useConnectionsModuleContext();
  const { activeTabId } = useWorkbench();
  const profile = profiles.find((item) => item.id === connectionId) ?? null;

  if (!profile) {
    return (
      <Empty className="min-h-[280px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Server className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Connection not found</EmptyTitle>
          <EmptyDescription>
            This tab points to a connection that is no longer available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card className="border">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            {profile.isDefault ? <Badge variant="secondary">default</Badge> : null}
            {profile.isConnected ? <Badge>connected</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Cluster {profile.clusterId}
            {profile.environmentTag ? ` - ${profile.environmentTag}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!profile.isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!activeTabId) {
                  return;
                }
                void connectConnection(activeTabId, profile);
              }}
            >
              <CheckCircle2 />
              Connect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!activeTabId) {
                  return;
                }
                void disconnectConnection(activeTabId, profile);
              }}
            >
              <PlugZap />
              Disconnect
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!activeTabId) {
                return;
              }
              void testConnection(activeTabId, profile);
            }}
          >
            <Play />
            Test
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (!activeTabId) {
                return;
              }
              openEdit(activeTabId, profile);
            }}
          >
            <Pencil />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!activeTabId) {
                return;
              }
              void deleteConnection(activeTabId, profile);
            }}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm text-muted-foreground">{profile.addresses.join(', ')}</p>
      </CardContent>
    </Card>
  );
};
