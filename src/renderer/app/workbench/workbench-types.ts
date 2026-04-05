import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type WorkbenchTabType = 'connection' | 'accounts' | 'transfers' | 'dashboard';

type WorkbenchTabBase = {
  id: string;
  type: WorkbenchTabType;
  moduleId: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  closable: boolean;
};

export type ConnectionWorkbenchTab = WorkbenchTabBase & {
  type: 'connection';
  moduleId: 'connections';
  connectionId: string;
};

export type AccountsWorkbenchTab = WorkbenchTabBase & {
  type: 'accounts';
  moduleId: 'connections';
  connectionId: string;
};

export type TransfersWorkbenchTab = WorkbenchTabBase & {
  type: 'transfers';
  moduleId: 'connections';
  connectionId: string;
};

export type DashboardWorkbenchTab = WorkbenchTabBase & {
  type: 'dashboard';
  moduleId: 'connections';
  connectionId?: string;
};

export type WorkbenchTab =
  | ConnectionWorkbenchTab
  | AccountsWorkbenchTab
  | TransfersWorkbenchTab
  | DashboardWorkbenchTab;

export type OpenWorkbenchTabInput = WorkbenchTab;

export type WorkbenchTabRendererProps<TTab extends WorkbenchTab = WorkbenchTab> = {
  tab: TTab;
};

export type WorkbenchTabDefinition<TTab extends WorkbenchTab = WorkbenchTab> = {
  moduleId: TTab['moduleId'];
  route: string;
  render: (props: WorkbenchTabRendererProps<TTab>) => ReactNode;
};
