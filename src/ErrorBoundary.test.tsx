// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function BuggyComponent(): JSX.Element {
  throw new Error('Test crash');
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Normal Content')).toBeTruthy();
  });

  it('catches render error and displays fallback UI with reset button', async () => {
    // Suppress console.error in Vitest output for intentional error test
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset App' })).toBeTruthy();
  });

  it('resets localStorage when reset button is clicked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    localStorage.setItem('value-compare:state:v1', '{"test": true}');
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: 'Reset App' }));
    expect(localStorage.getItem('value-compare:state:v1')).toBeNull();
    expect(reloadMock).toHaveBeenCalled();
  });
});
