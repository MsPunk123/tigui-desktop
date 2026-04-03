import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders bridge-driven values', async () => {
    window.tigui = {
      getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
      ping: vi.fn().mockResolvedValue('pong:hello'),
    };

    render(<App />);

    expect(await screen.findByTestId('app-version')).toHaveTextContent('1.0.0');
    expect(await screen.findByTestId('bridge-ping')).toHaveTextContent('pong:hello');
  });
});
