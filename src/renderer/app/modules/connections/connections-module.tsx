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
  Button,
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
              <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/40 p-4 text-sm text-muted-foreground">
                No connections yet.
              </div>
            ) : (
              <SidebarMenu>
                {profiles.map((profile) => {
                  const isSelected = selectedConnectionId === profile.id;
                  const isExpanded = Boolean(expandedConnectionIds[profile.id]);
                  const isConnected = profile.isConnected;

                  return (
                    <SidebarMenuItem key={profile.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isSelected}
                        className={cn(
                          'pr-11',
                          isSelected
                            ? 'bg-sidebar-accent/90 text-sidebar-accent-foreground ring-1 ring-sidebar-border/80 hover:bg-sidebar-accent/90'
                            : 'bg-sidebar hover:bg-sidebar-accent/70',
                        )}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer"
                          onClick={() => setSelectedConnectionId(profile.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedConnectionId(profile.id);
                            }
                          }}
                        >
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

                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">{profile.name}</span>
                              {!isConnected ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className="h-5 rounded-full border-sidebar-border/70 px-2 text-[10px]"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void connectConnection(profile);
                                  }}
                                >
                                  Connect
                                </Button>
                              ) : null}
                            </span>
                            {profile.environmentTag ? (
                              <span
                                className={cn(
                                  'mt-1 truncate text-[11px]',
                                  isSelected
                                    ? 'text-sidebar-accent-foreground/75'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {profile.environmentTag}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </SidebarMenuButton>

                      <SidebarMenuAction
                        type="button"
                        aria-label={
                          isExpanded ? 'Collapse connection row' : 'Expand connection row'
                        }
                        title={isExpanded ? 'Collapse connection row' : 'Expand connection row'}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleExpandedConnectionId(profile.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </SidebarMenuAction>

                      {isExpanded ? (
                        <div className="ml-10 mt-1 rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/35 px-3 py-2 text-xs text-muted-foreground">
                          Module area placeholder (future).
                        </div>
                      ) : null}
                    </SidebarMenuItem>
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
        <section className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{selectedProfile.name}</h3>
                {selectedProfile.isDefault ? (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    default
                  </span>
                ) : null}
                {selectedProfile.isConnected ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    connected
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Cluster {selectedProfile.clusterId}
                {selectedProfile.environmentTag ? ` - ${selectedProfile.environmentTag}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedProfile.addresses.join(', ')}
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
          </div>
        </section>
      ) : (
        <section className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Select a connection from the left panel, or click Connect to start using one.
        </section>
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
