import type { LucideIcon } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

export type AppModuleProviderProps = {
  children: ReactNode;
};

export type AppModuleDefinition = {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  Provider?: ComponentType<AppModuleProviderProps>;
  SidebarPanel: ComponentType;
  TopbarPanel: ComponentType;
  ContentPanel: ComponentType;
};
