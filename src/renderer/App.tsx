import { useEffect, useState } from 'react';

import { ConnectionsWorkspace } from '@/renderer/features/connections';

const App = () => {
  const [version, setVersion] = useState('loading...');

  useEffect(() => {
    void window.tigui.getAppVersion().then(setVersion);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">TigUI Desktop</p>
        <h1 className="text-2xl font-semibold tracking-tight">Connection Manager</h1>
        <p className="text-sm text-muted-foreground">
          SQL-viewer style connection setup for TigerBeetle clusters.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          App Version: <span data-testid="app-version">{version}</span>
        </p>
      </header>

      <section className="rounded-xl border bg-card p-5">
        <ConnectionsWorkspace />
      </section>
    </main>
  );
};

export default App;
