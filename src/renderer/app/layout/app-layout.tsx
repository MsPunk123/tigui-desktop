import type { ReactNode } from 'react';

import { ModuleNav } from '@/renderer/app/layout/sidebar/module-nav';
import { AppTopbar } from '@/renderer/app/layout/topbar/app-topbar';
import type { AppModuleDefinition } from '@/renderer/app/modules/module-types';
import { AppShell } from '@/renderer/shared/components/layout';

import { AppContent } from './content/app-content';

type AppLayoutProps = {
  appName: string;
  modules: AppModuleDefinition[];
  activeModuleId: string;
  onNavigateModuleRoute: (route: string) => void;
  sidebarContent: ReactNode;
  topbarContent: ReactNode;
  content: ReactNode;
};

export const AppLayout = ({
  appName,
  modules,
  activeModuleId,
  onNavigateModuleRoute,
  sidebarContent,
  topbarContent,
  content,
}: AppLayoutProps) => {
  const showModuleNav = modules.length > 1;

  return (
    <AppShell
      config={{
        sidebarWidthPx: 300,
        topbarHeightPx: 50,
        sidebarScrollable: false,
      }}
      appHeader={<p className="text-center text-sm font-semibold">{appName}</p>}
      sidebar={
        <>
          {showModuleNav ? (
            <>
              <ModuleNav
                modules={modules}
                activeModuleId={activeModuleId}
                onNavigate={onNavigateModuleRoute}
              />
              <div className="border-t" />
            </>
          ) : null}
          <div className="min-h-0 flex-1">{sidebarContent}</div>
        </>
      }
      topbar={<AppTopbar>{topbarContent}</AppTopbar>}
      content={<AppContent>{content}</AppContent>}
    />
  );
};
