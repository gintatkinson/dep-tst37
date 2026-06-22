/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import designTokens from '../../../.pipeline/logical-ui/design-tokens.json';

/**
 * Valid theme mode options.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Type definition for the ThemeContext value.
 */
export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props for the ThemeProvider component.
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Helper to safely load theme preference from localStorage.
 */
const getSavedTheme = (): ThemeMode => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = window.localStorage.getItem('theme') as ThemeMode | null;
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        return savedTheme;
      }
    }
  } catch {
    // Ignore security/unavailability issues in isolated environments
  }
  return 'system';
};

/**
 * Helper to safely save theme preference to localStorage.
 */
const saveTheme = (newTheme: ThemeMode): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', newTheme);
    }
  } catch {
    // Ignore security/unavailability issues in isolated environments
  }
};

/**
 * Provider component that manages the theme state, applies theme colors as CSS custom variables
 * on the document element, and synchronizes theme choices with localStorage and system settings.
 *
 * @realizes UML::ThemeEngine::ThemeProvider
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<ThemeMode>(getSavedTheme);
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Wrapper to update state and persist to localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasMatchMedia = typeof window.matchMedia === 'function';
    const mediaQuery = hasMatchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (!mediaQuery) return;

    const handleChange = () => {
      setSystemDark(mediaQuery.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      (mediaQuery as MediaQueryList).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        (mediaQuery as MediaQueryList).removeListener(handleChange);
      }
    };
  }, []);

  // Apply CSS custom variables when resolvedTheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const themesConfig = designTokens.themes as Record<string, Record<string, string>>;
    const activeTokens = themesConfig[resolvedTheme];

    if (activeTokens) {
      Object.entries(activeTokens).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      });
    }
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to consume the ThemeContext.
 * Throws an error if used outside of a ThemeProvider.
 *
 * @returns {ThemeContextType} The theme state and update function.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
