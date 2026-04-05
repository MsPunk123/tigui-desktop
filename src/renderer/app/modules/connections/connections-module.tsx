import { Unplug } from 'lucide-react';

import { ConnectionsModuleProvider } from '@/renderer/app/modules/connections/connections-module-provider';
import type { AppModuleDefinition } from '@/renderer/app/modules/module-types';
import {
  ConnectionsContentPanel,
  ConnectionsSidebarPanel,
} from '@/renderer/features/connections/components';

export const connectionsModuleDefinition: AppModuleDefinition = {
  id: 'connections',
  label: 'Connections',
  route: '/connections',
  icon: Unplug,
  Provider: ConnectionsModuleProvider,
  SidebarPanel: ConnectionsSidebarPanel,
  ContentPanel: ConnectionsContentPanel,
};
