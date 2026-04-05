import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders blank starter with bridge-driven values and toggle controls', async () => {
    window.tigui = {
      getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
      ping: vi.fn().mockResolvedValue('pong:hello'),
    };

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Blank Starter Foundation' })).toBeInTheDocument();
    expect(await screen.findByTestId('app-version')).toHaveTextContent('1.0.0');
    expect(await screen.findByTestId('bridge-ping')).toHaveTextContent('pong:hello');

    const notificationsToggle = screen.getByRole('button', { name: /enable notifications/i });
    expect(notificationsToggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(notificationsToggle);
    expect(notificationsToggle).toHaveAttribute('aria-pressed', 'false');
  });
});
