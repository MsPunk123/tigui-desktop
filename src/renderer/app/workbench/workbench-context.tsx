import { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer } from 'react';

import { getWorkbenchTabRoute } from './workbench-registry';
import { INITIAL_WORKBENCH_STATE, workbenchReducer } from './workbench-state';
import type { OpenWorkbenchTabInput, WorkbenchTab } from './workbench-types';

type WorkbenchContextValue = {
  tabs: WorkbenchTab[];
  activeTabId: string | null;
  activeTab: WorkbenchTab | null;
  openTab: (input: OpenWorkbenchTabInput) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  updateTab: (tabId: string, patch: Partial<WorkbenchTab>) => void;
};

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

type WorkbenchProviderProps = {
  children: ReactNode;
  activeRoute: string;
  onNavigateRoute: (route: string) => void;
};

export const WorkbenchProvider = ({
  children,
  activeRoute,
  onNavigateRoute,
}: WorkbenchProviderProps) => {
  const [{ tabs, activeTabId }, dispatch] = useReducer(workbenchReducer, INITIAL_WORKBENCH_STATE);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? null,
    [activeTabId, tabs],
  );

  const openTab = (input: OpenWorkbenchTabInput) => {
    dispatch({ type: 'open_tab', input });
  };

  const setActiveTab = (tabId: string) => {
    dispatch({ type: 'set_active_tab', tabId });
  };

  const closeTab = (tabId: string) => {
    dispatch({ type: 'close_tab', tabId });
  };

  const closeOtherTabs = (tabId: string) => {
    dispatch({ type: 'close_other_tabs', tabId });
  };

  const updateTab = (tabId: string, patch: Partial<WorkbenchTab>) => {
    dispatch({ type: 'update_tab', tabId, patch });
  };

  useEffect(() => {
    if (!activeTab) {
      return;
    }

    const nextRoute = getWorkbenchTabRoute(activeTab);
    if (activeRoute !== nextRoute) {
      onNavigateRoute(nextRoute);
    }
  }, [activeRoute, activeTab, onNavigateRoute]);

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      tabs,
      activeTabId,
      activeTab,
      openTab,
      setActiveTab,
      closeTab,
      closeOtherTabs,
      updateTab,
    }),
    [activeTab, activeTabId, tabs],
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
};

export const useWorkbench = (): WorkbenchContextValue => {
  const value = useContext(WorkbenchContext);
  if (!value) {
    throw new Error('Workbench context is not available.');
  }

  return value;
};
