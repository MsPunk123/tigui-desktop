import { useEffect, useState } from 'react';

import { Button, Toggle, ToggleGroup, ToggleGroupItem } from '@/renderer/shared/components/ui';

const App = () => {
  const [version, setVersion] = useState('loading...');
  const [pingResult, setPingResult] = useState('pending...');
  const [view, setView] = useState('overview');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    void window.tigui.getAppVersion().then(setVersion);
    void window.tigui.ping('hello').then(setPingResult);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
      <section className="w-full rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">TigUI Desktop</p>
          <h1 className="text-2xl font-semibold tracking-tight">Blank Starter Foundation</h1>
          <p className="text-sm text-muted-foreground">
            Tailwind v4 + shadcn-style primitives are now the baseline for upcoming UI work.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">App Version</p>
            <p className="mt-2 text-xl font-semibold" data-testid="app-version">
              {version}
            </p>
          </article>
          <article className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bridge Ping</p>
            <p className="mt-2 text-xl font-semibold" data-testid="bridge-ping">
              {pingResult}
            </p>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Toggle
            aria-label="Enable notifications"
            pressed={notifications}
            onPressedChange={setNotifications}
          >
            Notifications: {notifications ? 'On' : 'Off'}
          </Toggle>

          <ToggleGroup type="single" value={view} onValueChange={(next) => next && setView(next)}>
            <ToggleGroupItem value="overview">Overview</ToggleGroupItem>
            <ToggleGroupItem value="details">Details</ToggleGroupItem>
          </ToggleGroup>

          <Button type="button" variant="default">
            Start Building
          </Button>
        </div>

        <footer className="mt-6 text-xs text-muted-foreground">
          Active view: <span className="font-medium text-foreground">{view}</span>
        </footer>
      </section>
    </main>
  );
};

export default App;
