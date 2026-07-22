import { Server } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { INITIAL_WORKBENCH_STATE, workbenchReducer } from './workbench-state';

const connectionTab = (id: string, title: string) => ({
  id,
  type: 'connection' as const,
  moduleId: 'connections' as const,
  icon: Server,
  connectionId: id.replace('connection:', ''),
  title,
  subtitle: 'local',
  closable: true,
});

const accountsTab = (connectionId: string, title: string) => ({
  id: `accounts:${connectionId}`,
  type: 'accounts' as const,
  moduleId: 'connections' as const,
  icon: Server,
  connectionId,
  title,
  subtitle: 'local',
  closable: true,
});

describe('workbenchReducer', () => {
  it('opens tabs, updates the active tab, and preserves one tab per id', () => {
    const opened = workbenchReducer(INITIAL_WORKBENCH_STATE, {
      type: 'open_tab',
      input: connectionTab('connection:primary', 'Primary Cluster'),
    });

    const reopened = workbenchReducer(opened, {
      type: 'open_tab',
      input: {
        ...connectionTab('connection:primary', 'Primary Cluster Renamed'),
        subtitle: 'staging',
      },
    });

    expect(reopened.tabs).toHaveLength(1);
    expect(reopened.activeTabId).toBe('connection:primary');
    expect(reopened.tabs[0].title).toBe('Primary Cluster Renamed');
    expect(reopened.tabs[0].subtitle).toBe('staging');
  });

  it('closes the active tab and falls back to the nearest remaining tab', () => {
    const withTabs = workbenchReducer(
      workbenchReducer(INITIAL_WORKBENCH_STATE, {
        type: 'open_tab',
        input: connectionTab('connection:first', 'First'),
      }),
      {
        type: 'open_tab',
        input: connectionTab('connection:second', 'Second'),
      },
    );

    const closed = workbenchReducer(withTabs, {
      type: 'close_tab',
      tabId: 'connection:second',
    });

    expect(closed.tabs).toHaveLength(1);
    expect(closed.tabs[0].id).toBe('connection:first');
    expect(closed.activeTabId).toBe('connection:first');
  });

  it('closes other tabs while keeping the requested tab active', () => {
    const withTabs = ['first', 'second', 'third'].reduce(
      (state, name) =>
        workbenchReducer(state, {
          type: 'open_tab',
          input: connectionTab(`connection:${name}`, name),
        }),
      INITIAL_WORKBENCH_STATE,
    );

    const isolated = workbenchReducer(withTabs, {
      type: 'close_other_tabs',
      tabId: 'connection:second',
    });

    expect(isolated.tabs).toHaveLength(1);
    expect(isolated.tabs[0].id).toBe('connection:second');
    expect(isolated.activeTabId).toBe('connection:second');
  });

  it('reuses one accounts tab per connection id', () => {
    const opened = workbenchReducer(INITIAL_WORKBENCH_STATE, {
      type: 'open_tab',
      input: accountsTab('primary', 'Primary Accounts'),
    });

    const reopened = workbenchReducer(opened, {
      type: 'open_tab',
      input: { ...accountsTab('primary', 'Primary Accounts'), subtitle: 'staging' },
    });

    expect(reopened.tabs).toHaveLength(1);
    expect(reopened.activeTabId).toBe('accounts:primary');
    expect(reopened.tabs[0].subtitle).toBe('staging');
  });
});
