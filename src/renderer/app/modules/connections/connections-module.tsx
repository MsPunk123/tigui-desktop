import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Play,
  Plus,
  Server,
  Trash2,
  Unplug,
  Waypoints,
} from 'lucide-react';
import { createContext, useContext, useMemo, useState } from 'react';

import type {
  AppModuleDefinition,
  AppModuleProviderProps,
} from '@/renderer/app/modules/module-types';
import { ConnectionEditorPanel } from '@/renderer/features/connections/components/connection-editor-panel';
import { useConnectionsWorkspace } from '@/renderer/features/connections/hooks/use-connections-workspace';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/renderer/shared/components/ui';
import { cn } from '@/renderer/shared/lib/cn';
import type { ConnectionProfile } from '@/shared/connections';

type ConnectionsModuleContextValue = ReturnType<typeof useConnectionsWorkspace> & {
  selectedConnectionId: string | null;
  setSelectedConnectionId: (id: string | null) => void;
  expandedConnectionIds: Record<string, boolean>;
  toggleExpandedConnectionId: (id: string) => void;
  selectedProfile: ConnectionProfile | null;
};

const ConnectionsModuleContext = createContext<ConnectionsModuleContextValue | null>(null);

const useConnectionsModuleContext = (): ConnectionsModuleContextValue => {
  const value = useContext(ConnectionsModuleContext);
  if (!value) {
    throw new Error('Connections module context is not available.');
  }
  return value;
};

const ConnectionsModuleProvider = ({ children }: AppModuleProviderProps) => {
  const workspace = useConnectionsWorkspace();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [expandedConnectionIds, setExpandedConnectionIds] = useState<Record<string, boolean>>({});

  const selectedProfile = useMemo(() => {
    return workspace.profiles.find((profile) => profile.id === selectedConnectionId) ?? null;
  }, [workspace.profiles, selectedConnectionId]);

  const toggleExpandedConnectionId = (id: string) => {
    setExpandedConnectionIds((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const contextValue: ConnectionsModuleContextValue = {
    ...workspace,
    selectedConnectionId,
    setSelectedConnectionId,
    expandedConnectionIds,
    toggleExpandedConnectionId,
    selectedProfile,
  };

  if (workspace.isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading connection profiles...</p>;
  }

  return (
    <ConnectionsModuleContext.Provider value={contextValue}>
      {children}
    </ConnectionsModuleContext.Provider>
  );
};

const ConnectionsSidebarPanel = () => {
  const {
    profiles,
    connectConnection,
    expandedConnectionIds,
    toggleExpandedConnectionId,
    selectedConnectionId,
    setSelectedConnectionId,
    openCreate,
  } = useConnectionsModuleContext();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="gap-3 p-3">
          <div className="flex items-center gap-2 px-1">
            <SidebarGroupLabel asChild>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Waypoints className="size-4 text-sidebar-foreground/70" />
                <h2 className="truncate text-sm font-semibold tracking-normal text-sidebar-foreground normal-case">
                  Connections ({profiles.length})
                </h2>
              </div>
            </SidebarGroupLabel>

            <SidebarGroupAction
              type="button"
              onClick={() => openCreate()}
              aria-label="Add connection"
              title="Add connection"
            >
              <Plus className="size-4" />
            </SidebarGroupAction>
          </div>

          <SidebarGroupContent>
            {profiles.length === 0 ? (
              <Empty className="border-sidebar-border bg-sidebar-accent/40 px-4 py-6 text-sidebar-foreground">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Waypoints className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No connections yet</EmptyTitle>
                  <EmptyDescription className="text-sidebar-foreground/70">
                    Create your first connection to start working with a cluster.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <SidebarMenu>
                {profiles.map((profile) => {
                  const isSelected = selectedConnectionId === profile.id;
                  const isExpanded = Boolean(expandedConnectionIds[profile.id]);
                  const isConnected = profile.isConnected;

                  return (
                    <Collapsible
                      key={profile.id}
                      asChild
                      open={isExpanded}
                      onOpenChange={() => toggleExpandedConnectionId(profile.id)}
                    >
                      <SidebarMenuItem>
                        <div
                          className={cn(
                            'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg transition-colors',
                            isSelected
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border/80 hover:bg-sidebar-accent'
                              : 'bg-sidebar hover:bg-sidebar-accent/70',
                          )}
                        >
                          <SidebarMenuButton
                            type="button"
                            isActive={isSelected}
                            className={cn(
                              'pr-3 hover:bg-transparent',
                              isSelected && 'bg-transparent hover:bg-transparent',
                            )}
                            onClick={() => setSelectedConnectionId(profile.id)}
                          >
                            <span className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                              <span className="relative flex size-8 items-center justify-center rounded-md border border-sidebar-border/70 bg-sidebar-accent/60">
                                <Server
                                  className={
                                    isSelected
                                      ? 'size-4 text-sidebar-accent-foreground'
                                      : 'size-4 text-muted-foreground'
                                  }
                                />
                                {isConnected ? (
                                  <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
                                ) : null}
                              </span>

                              <span className="min-w-0">
                                <span className="block w-full truncate font-medium">
                                  {profile.name}
                                </span>
                                {profile.environmentTag ? (
                                  <span
                                    className={cn(
                                      'mt-1 block w-full truncate text-[11px]',
                                      isSelected
                                        ? 'text-sidebar-accent-foreground/75'
                                        : 'text-muted-foreground',
                                    )}
                                  >
                                    {profile.environmentTag}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </SidebarMenuButton>

                          <div className="flex w-[7rem] shrink-0 items-center justify-end gap-1">
                            <button
                              type="button"
                              className="h-6 flex-1 cursor-pointer rounded-md"
                              aria-label={`Select ${profile.name}`}
                              onClick={() => setSelectedConnectionId(profile.id)}
                            />
                            {!isConnected ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className={cn(
                                  'h-5 rounded-full border-sidebar-border/70 px-2 text-[10px]',
                                  isSelected &&
                                    'border-sidebar-accent-foreground/20 bg-sidebar text-sidebar-accent-foreground hover:bg-sidebar/90',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void connectConnection(profile);
                                }}
                              >
                                Connect
                              </Button>
                            ) : (
                              <span className="w-[3.75rem]" aria-hidden="true" />
                            )}

                            <CollapsibleTrigger asChild>
                              <SidebarMenuAction
                                type="button"
                                className={cn(
                                  'static size-6 translate-y-0 hover:bg-transparent',
                                  isSelected &&
                                    'text-sidebar-accent-foreground/70 hover:text-sidebar-accent-foreground',
                                )}
                                onClick={(event) => event.stopPropagation()}
                                aria-label={
                                  isExpanded ? 'Collapse connection row' : 'Expand connection row'
                                }
                                title={
                                  isExpanded ? 'Collapse connection row' : 'Expand connection row'
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </SidebarMenuAction>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="ml-10 mt-1">
                            <Card className="border border-dashed border-sidebar-border bg-sidebar-accent/35 py-0 text-sidebar-foreground shadow-none ring-0">
                              <CardContent className="px-3 py-2 text-xs text-muted-foreground">
                                Module area placeholder (future).
                              </CardContent>
                            </Card>
                          </div>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const ConnectionsTopbarPanel = () => {
  return (
    <div className="text-sm text-muted-foreground">
      Future goal: tabs section will be added here
    </div>
  );
};

const ConnectionsContentPanel = () => {
  const {
    notice,
    validationErrors,
    editorState,
    selectedProfile,
    isSubmitting,
    closeEditor,
    submitEditor,
    connectConnection,
    testConnection,
    openEdit,
    deleteConnection,
  } = useConnectionsModuleContext();

  return (
    <>
      {notice ? <div className="mb-4 rounded-md border px-3 py-2 text-sm">{notice}</div> : null}

      {validationErrors.length > 0 ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">Please fix the following:</p>
          <ul className="ml-4 list-disc">
            {validationErrors.map((error) => (
              <li key={`${error.field}-${error.message}`}>
                {error.field}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {editorState.mode !== 'closed' ? (
        <ConnectionEditorPanel
          mode={editorState.mode}
          initialValues={editorState.initialValues}
          isSubmitting={isSubmitting}
          onCancel={closeEditor}
          onSubmit={(values) => void submitEditor(values)}
        />
      ) : selectedProfile ? (
        <Card className="border">
          <CardHeader className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl font-semibold">{selectedProfile.name}</CardTitle>
                {selectedProfile.isDefault ? <Badge variant="secondary">default</Badge> : null}
                {selectedProfile.isConnected ? <Badge>connected</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Cluster {selectedProfile.clusterId}
                {selectedProfile.environmentTag ? ` - ${selectedProfile.environmentTag}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!selectedProfile.isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void connectConnection(selectedProfile)}
                >
                  <CheckCircle2 />
                  Connect
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void testConnection(selectedProfile)}
              >
                <Play />
                Test
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openEdit(selectedProfile)}>
                <Pencil />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void deleteConnection(selectedProfile)}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{selectedProfile.addresses.join(', ')}</p>
          </CardContent>
        </Card>
      ) : (
        <Empty className="min-h-[280px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Server className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No connection selected</EmptyTitle>
            <EmptyDescription>
              Select a connection from the left panel, or click Connect to start using one.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
};

export const connectionsModuleDefinition: AppModuleDefinition = {
  id: 'connections',
  label: 'Connections',
  route: '/connections',
  icon: Unplug,
  Provider: ConnectionsModuleProvider,
  SidebarPanel: ConnectionsSidebarPanel,
  TopbarPanel: ConnectionsTopbarPanel,
  ContentPanel: ConnectionsContentPanel,
};
