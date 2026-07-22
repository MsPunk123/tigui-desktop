import type { OpenWorkbenchTabInput, WorkbenchTab } from './workbench-types';

export type WorkbenchState = {
  tabs: WorkbenchTab[];
  activeTabId: string | null;
};

export type WorkbenchAction =
  | { type: 'open_tab'; input: OpenWorkbenchTabInput }
  | { type: 'set_active_tab'; tabId: string }
  | { type: 'close_tab'; tabId: string }
  | { type: 'close_other_tabs'; tabId: string }
  | { type: 'update_tab'; tabId: string; patch: Partial<WorkbenchTab> };

export const INITIAL_WORKBENCH_STATE: WorkbenchState = {
  tabs: [],
  activeTabId: null,
};

const getFallbackActiveTabId = (tabs: WorkbenchTab[], removedTabId: string): string | null => {
  const removedTabIndex = tabs.findIndex((tab) => tab.id === removedTabId);
  if (removedTabIndex === -1) {
    return null;
  }

  const nextTabs = tabs.filter((tab) => tab.id !== removedTabId);
  const fallbackTab = nextTabs[removedTabIndex] ?? nextTabs[removedTabIndex - 1] ?? null;
  return fallbackTab?.id ?? null;
};

export const workbenchReducer = (
  state: WorkbenchState,
  action: WorkbenchAction,
): WorkbenchState => {
  switch (action.type) {
    case 'open_tab': {
      const existing = state.tabs.find((tab) => tab.id === action.input.id);
      if (existing) {
        return {
          tabs: state.tabs.map((tab) =>
            tab.id === action.input.id ? { ...tab, ...action.input } : tab,
          ),
          activeTabId: action.input.id,
        };
      }

      return {
        tabs: [...state.tabs, action.input],
        activeTabId: action.input.id,
      };
    }

    case 'set_active_tab':
      return {
        ...state,
        activeTabId: action.tabId,
      };

    case 'close_tab': {
      if (!state.tabs.some((tab) => tab.id === action.tabId)) {
        return state;
      }

      return {
        tabs: state.tabs.filter((tab) => tab.id !== action.tabId),
        activeTabId:
          state.activeTabId === action.tabId
            ? getFallbackActiveTabId(state.tabs, action.tabId)
            : state.activeTabId,
      };
    }

    case 'close_other_tabs': {
      const remainingTab = state.tabs.find((tab) => tab.id === action.tabId);
      if (!remainingTab) {
        return state;
      }

      return {
        tabs: [remainingTab],
        activeTabId: action.tabId,
      };
    }

    case 'update_tab':
      return {
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.id === action.tabId ? ({ ...tab, ...action.patch } as WorkbenchTab) : tab,
        ),
      };

    default:
      return state;
  }
};
