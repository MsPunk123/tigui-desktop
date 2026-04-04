import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button, Toggle, ToggleGroup, ToggleGroupItem } from '@/renderer/shared/components/ui';

describe('shared ui components', () => {
  it('applies variants and sizes on button', () => {
    render(
      <Button size="lg" variant="destructive">
        Delete
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive/10', 'h-8');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('toggles pressed state', () => {
    const onPressedChange = vi.fn();

    render(
      <Toggle aria-label="Compact mode" onPressedChange={onPressedChange}>
        Compact
      </Toggle>,
    );

    const toggle = screen.getByRole('button', { name: 'Compact mode' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('changes selected value in toggle group', () => {
    const onValueChange = vi.fn();

    render(
      <ToggleGroup onValueChange={onValueChange} type="single">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));

    expect(onValueChange).toHaveBeenCalledWith('grid');
  });
});
