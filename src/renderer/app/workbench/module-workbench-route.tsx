import { Fragment } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AppLayout } from '@/renderer/app/layout';
import { APP_MODULES, APP_MODULES_BY_ROUTE } from '@/renderer/app/modules/module-registry';

type ModuleWorkbenchRouteProps = {
  appName: string;
};

export const ModuleWorkbenchRoute = ({ appName }: ModuleWorkbenchRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();

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
        sidebarContent={<activeModule.SidebarPanel />}
        topbarContent={<activeModule.TopbarPanel />}
        content={<activeModule.ContentPanel />}
      />
    </Provider>
  );
};
