import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ModuleWorkbenchRoute } from '@/renderer/app/workbench';
import { TooltipProvider } from '@/renderer/shared/components/ui/tooltip';

const App = () => {
  return (
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/connections" replace />} />
          <Route path="*" element={<ModuleWorkbenchRoute appName="TigUI Desktop" />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  );
};

export default App;
