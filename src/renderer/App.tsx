import { useEffect, useState } from 'react';

const App = () => {
  const [version, setVersion] = useState('loading...');
  const [pingResult, setPingResult] = useState('pending...');

  useEffect(() => {
    void window.tigui.getAppVersion().then(setVersion);
    void window.tigui.ping('hello').then(setPingResult);
  }, []);

  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">TigUI Desktop</p>
        <h1>Electron + React Foundation</h1>
        <p className="subtitle">Secure by default process model with typed preload IPC.</p>
        <div className="meta-grid">
          <article>
            <h2>App Version</h2>
            <p data-testid="app-version">{version}</p>
          </article>
          <article>
            <h2>Bridge Health</h2>
            <p data-testid="bridge-ping">{pingResult}</p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default App;
