import { LayoutDashboard, ListTree } from 'lucide-react';
import type { ReactNode } from 'react';

import { WorkbenchPlaceholder } from '@/renderer/app/workbench/components/workbench-placeholder';
import type {
  WorkbenchTab,
  WorkbenchTabDefinition,
} from '@/renderer/app/workbench/workbench-types';
import { AccountsWorkbenchTabContent } from '@/renderer/features/connections/components/accounts-workbench-tab-content';
import { ConnectionWorkbenchTabContent } from '@/renderer/features/connections/components/connection-workbench-tab-content';

type WorkbenchDefinitionMap = {
  [TType in WorkbenchTab['type']]: WorkbenchTabDefinition<Extract<WorkbenchTab, { type: TType }>>;
};

const WORKBENCH_TAB_DEFINITIONS: WorkbenchDefinitionMap = {
  connection: {
    moduleId: 'connections',
    route: '/connections',
    render: ({ tab }) => <ConnectionWorkbenchTabContent connectionId={tab.connectionId} />,
  },
  accounts: {
    moduleId: 'connections',
    route: '/connections',
    render: ({ tab }) => <AccountsWorkbenchTabContent connectionId={tab.connectionId} />,
  },
  transfers: {
    moduleId: 'connections',
    route: '/connections',
    render: () => (
      <WorkbenchPlaceholder
        title="Transfers tab is not implemented yet"
        description="This placeholder keeps the workbench model ready for future modules and resources."
        icon={<ListTree className="size-4" />}
      />
    ),
  },
  dashboard: {
    moduleId: 'connections',
    route: '/connections',
    render: () => (
      <WorkbenchPlaceholder
        title="Dashboard tab is not implemented yet"
        description="Future global views can live in the shared topbar without changing the shell."
        icon={<LayoutDashboard className="size-4" />}
      />
    ),
  },
};

const getWorkbenchTabDefinition = <TTab extends WorkbenchTab>(
  tab: TTab,
): WorkbenchTabDefinition<TTab> => {
  return WORKBENCH_TAB_DEFINITIONS[tab.type] as unknown as WorkbenchTabDefinition<TTab>;
};

export const getWorkbenchTabRoute = (tab: WorkbenchTab): string => {
  return getWorkbenchTabDefinition(tab).route;
};

export const renderWorkbenchTabContent = (tab: WorkbenchTab): ReactNode => {
  return getWorkbenchTabDefinition(tab).render({ tab });
};
