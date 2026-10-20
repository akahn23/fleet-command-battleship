import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

describe('How to Play intro', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('opens on first visit, focuses Begin, and stores dismissal', () => {
    render(<App seed={7} />);

    const dialog = screen.getByRole('dialog', { name: 'How to Play' });
    const begin = screen.getByRole('button', { name: 'Begin' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(begin);
    expect(document.querySelector('main')).toHaveAttribute('inert');

    fireEvent.click(begin);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('ravenfjord.introSeen')).toBe('1');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
  });

  it('falls back to showing the dialog when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    render(<App seed={7} />);

    expect(screen.getByRole('dialog', { name: 'How to Play' })).toBeInTheDocument();
  });

  it('closes with Escape and returns focus to the header when reopened there', () => {
    render(<App seed={7} showIntro={false} />);
    const reopen = screen.getByRole('button', { name: 'How to Play' });

    fireEvent.click(reopen);
    expect(screen.getByRole('dialog', { name: 'How to Play' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(reopen);
  });
});
