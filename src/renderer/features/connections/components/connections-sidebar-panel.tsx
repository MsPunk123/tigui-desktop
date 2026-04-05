import { ChevronDown, ChevronRight, Plus, Server, Waypoints } from 'lucide-react';

import { useConnectionsModuleContext } from '@/renderer/app/modules/connections/connections-module-provider';
import { useWorkbench } from '@/renderer/app/workbench';
import {
  Button,
  Card,
  CardContent,
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

export const ConnectionsSidebarPanel = () => {
  const {
    profiles,
    connectConnection,
    expandedConnectionIds,
    toggleExpandedConnectionId,
    selectedConnectionId,
    openCreate,
    openConnectionTab,
  } = useConnectionsModuleContext();
  const { activeTabId } = useWorkbench();

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
              onClick={() => openCreate(activeTabId)}
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
                            onClick={() => openConnectionTab(profile)}
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

                          <div className="flex shrink-0 items-center justify-end gap-1">
                            {!isConnected ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openConnectionTab(profile);
                                  void connectConnection(`connection:${profile.id}`, profile);
                                }}
                              >
                                Connect
                              </Button>
                            ) : (
                              <span className="w-0" aria-hidden="true" />
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
