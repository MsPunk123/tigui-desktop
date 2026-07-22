import { Fragment } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AppLayout } from '@/renderer/app/layout';
import { APP_MODULES, APP_MODULES_BY_ROUTE } from '@/renderer/app/modules/module-registry';
import { WorkbenchTabs } from '@/renderer/app/workbench/components/workbench-tabs';
import { useWorkbench, WorkbenchProvider } from '@/renderer/app/workbench/workbench-context';

type ModuleWorkbenchRouteProps = {
  appName: string;
};

const ModuleWorkbenchLayout = ({ appName }: ModuleWorkbenchRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tabs, activeTabId, setActiveTab, closeTab } = useWorkbench();

  const activeModule = APP_MODULES_BY_ROUTE.get(location.pathname);
  if (!activeModule) {
    return <Navigate to="/connections" replace />;
  }

  const Provider = activeModule.Provider ?? Fragment;

  return (
    <Provider>
      <AppLayout
        appName={appName}
        modules={APP_MODULES}
        activeModuleId={activeModule.id}
        onNavigateModuleRoute={(route) => navigate(route)}
        topbarTabs={
          <WorkbenchTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
          />
        }
        sidebarContent={<activeModule.SidebarPanel />}
        topbarContent={activeModule.TopbarPanel ? <activeModule.TopbarPanel /> : null}
        content={<activeModule.ContentPanel />}
      />
    </Provider>
  );
};

export const ModuleWorkbenchRoute = ({ appName }: ModuleWorkbenchRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeModule = APP_MODULES_BY_ROUTE.get(location.pathname);
  if (!activeModule) {
    return <Navigate to="/connections" replace />;
  }

  return (
    <WorkbenchProvider activeRoute={location.pathname} onNavigateRoute={(route) => navigate(route)}>
      <ModuleWorkbenchLayout appName={appName} />
    </WorkbenchProvider>
  );
};
