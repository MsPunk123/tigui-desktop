import { Rows3, Server } from 'lucide-react';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

import type { AppModuleProviderProps } from '@/renderer/app/modules/module-types';
import { useWorkbench } from '@/renderer/app/workbench';
import {
  type ConnectionsWorkspace,
  useConnectionsWorkspace,
} from '@/renderer/features/connections/hooks/use-connections-workspace';
import type { ConnectionProfile } from '@/shared/connections';

export type ConnectionsModuleContextValue = ConnectionsWorkspace & {
  selectedConnectionId: string | null;
  expandedConnectionIds: Record<string, boolean>;
  toggleExpandedConnectionId: (id: string) => void;
  openConnectionTab: (profile: ConnectionProfile) => void;
  openAccountsTab: (profile: ConnectionProfile) => void;
};

const ConnectionsModuleContext = createContext<ConnectionsModuleContextValue | null>(null);

export const useConnectionsModuleContext = (): ConnectionsModuleContextValue => {
  const value = useContext(ConnectionsModuleContext);
  if (!value) {
    throw new Error('Connections module context is not available.');
  }

  return value;
};

type ConnectionsModuleProviderContentProps = {
  children: ReactNode;
};

const ConnectionsModuleProviderContent = ({ children }: ConnectionsModuleProviderContentProps) => {
  const workspace = useConnectionsWorkspace();
  const [expandedConnectionIds, setExpandedConnectionIds] = useState<Record<string, boolean>>({});
  const { activeTab, activeTabId, tabs, closeTab, openTab, updateTab } = useWorkbench();
  const previousTabIdsRef = useRef<string[]>([]);

  const selectedConnectionId =
    activeTab?.type === 'connection' || activeTab?.type === 'accounts'
      ? activeTab.connectionId
      : null;

  useEffect(() => {
    const profilesById = new Map(workspace.profiles.map((profile) => [profile.id, profile]));

    tabs.forEach((tab) => {
      if (tab.type !== 'connection' && tab.type !== 'accounts') {
        return;
      }

      const profile = profilesById.get(tab.connectionId);
      if (!profile) {
        closeTab(tab.id);
        return;
      }

      const nextTitle = tab.type === 'accounts' ? `${profile.name} Accounts` : profile.name;
      if (tab.title !== nextTitle || tab.subtitle !== profile.environmentTag) {
        updateTab(tab.id, {
          title: nextTitle,
          subtitle: profile.environmentTag,
        });
      }
    });
  }, [closeTab, tabs, updateTab, workspace.profiles]);

  useEffect(() => {
    if (workspace.overlayState.mode !== 'closed') {
      workspace.closeEditor();
    }
  }, [activeTabId]);

  useEffect(() => {
    const previousTabIds = previousTabIdsRef.current;
    const nextTabIds = tabs.map((tab) => tab.id);

    previousTabIds
      .filter((tabId) => !nextTabIds.includes(tabId))
      .forEach((tabId) => workspace.clearTabUiState(tabId));

    previousTabIdsRef.current = nextTabIds;
  }, [tabs]);

  const toggleExpandedConnectionId = (id: string) => {
    setExpandedConnectionIds((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const openConnectionTab = (profile: ConnectionProfile) => {
    const tabId = `connection:${profile.id}`;
    workspace.ensureTabUiState(tabId);
    openTab({
      id: tabId,
      type: 'connection',
      moduleId: 'connections',
      icon: Server,
      connectionId: profile.id,
      title: profile.name,
      subtitle: profile.environmentTag,
      closable: true,
    });
  };

  const openAccountsTab = (profile: ConnectionProfile) => {
    const tabId = `accounts:${profile.id}`;
    workspace.ensureTabUiState(tabId);
    openTab({
      id: tabId,
      type: 'accounts',
      moduleId: 'connections',
      icon: Rows3,
      connectionId: profile.id,
      title: `${profile.name} Accounts`,
      subtitle: profile.environmentTag,
      closable: true,
    });
  };

  const contextValue: ConnectionsModuleContextValue = {
    ...workspace,
    selectedConnectionId,
    expandedConnectionIds,
    toggleExpandedConnectionId,
    openConnectionTab,
    openAccountsTab,
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

export const ConnectionsModuleProvider = ({ children }: AppModuleProviderProps) => {
  return <ConnectionsModuleProviderContent>{children}</ConnectionsModuleProviderContent>;
};
