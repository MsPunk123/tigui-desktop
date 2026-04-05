import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ModuleWorkbenchRoute } from '@/renderer/app/workbench';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/connections" replace />} />
        <Route path="*" element={<ModuleWorkbenchRoute appName="TigUI Desktop" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
