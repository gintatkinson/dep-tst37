import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import designTokens from '../../../.pipeline/logical-ui/design-tokens.json';

const ThemeTestComponent = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-mode">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button data-testid="btn-light" onClick={() => setTheme('light')}>Light</button>
      <button data-testid="btn-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="btn-system" onClick={() => setTheme('system')}>System</button>
    </div>
  );
};

describe('Theme Engine', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      length: 0,
      key: vi.fn(() => null),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Reset document styles
    document.documentElement.removeAttribute('style');
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('defaults to system theme when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light'); // since matchMedia matches: false
  });

  it('loads default theme from localStorage', () => {
    window.localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
  });

  it('changes theme and persists to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('system');

    // Change to dark
    act(() => {
      screen.getByTestId('btn-dark').click();
    });

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    // Change to light
    act(() => {
      screen.getByTestId('btn-light').click();
    });

    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('applies CSS custom variables to document.documentElement for light and dark themes', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    // Switch to light
    act(() => {
      screen.getByTestId('btn-light').click();
    });

    const lightTokens = designTokens.themes.light;
    Object.entries(lightTokens).forEach(([key, value]) => {
      expect(document.documentElement.style.getPropertyValue(`--theme-${key}`)).toBe(value);
    });

    // Switch to dark
    act(() => {
      screen.getByTestId('btn-dark').click();
    });

    const darkTokens = designTokens.themes.dark;
    Object.entries(darkTokens).forEach(([key, value]) => {
      expect(document.documentElement.style.getPropertyValue(`--theme-${key}`)).toBe(value);
    });
  });

  it('resolves system theme based on media query', () => {
    // Mock matchMedia to match dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    
    // Check that dark tokens are applied
    const darkTokens = designTokens.themes.dark;
    Object.entries(darkTokens).forEach(([key, value]) => {
      expect(document.documentElement.style.getPropertyValue(`--theme-${key}`)).toBe(value);
    });
  });
});
