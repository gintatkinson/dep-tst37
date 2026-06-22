# Implementation Plan - Theme Engine Integration

This implementation plan details the target changes to configure the theme engine and state context for the React application, following the high-density console standards and clean architecture profile.

## Proposed Changes

### 1. Update Design Tokens File
- **Target File:** `.pipeline/logical-ui/design-tokens.json`
- **Changes:** Replace the content with the updated schema version `1.1.0` containing light and dark theme configurations, layout spacing variables, and high-density typography options.

### 2. Create Theme Context Provider
- **Target File:** `web_react/src/context/ThemeContext.tsx`
- **Changes:**
  - Define `Theme` types: `'light' | 'dark' | 'system'`.
  - Create `ThemeContext` and `ThemeProvider` component.
  - Implement a `useTheme` hook.
  - Read design tokens dynamically. Set theme variables as CSS custom properties (`--theme-*`) on `document.documentElement` based on the active theme mode.
  - For `'system'` mode, listen to user preference changes via media query listener (`(prefers-color-scheme: dark)`).
  - Persist active selection to `localStorage`.
  - Include SSR and headless unit testing environment safety checks (`typeof window !== 'undefined'`).

### 3. Wrap Main App with ThemeProvider
- **Target File:** `web_react/src/App.tsx`
- **Changes:**
  - Import `ThemeProvider` from `./context/ThemeContext`.
  - Wrap the React tree within `ThemeProvider`.

### 4. Create Theme Unit/Widget Tests
- **Target File:** `web_react/src/test/theme.test.tsx`
- **Changes:**
  - Verify default theme is 'system' or loaded from `localStorage`.
  - Verify changing the theme updates the context state and persists in `localStorage`.
  - Verify styling CSS properties are set correctly on `document.documentElement.style` for both light and dark modes when switching.

## Verification & Testing Plan
1. Run `npm run test` inside the `web_react/` directory to run all unit tests including the new `theme.test.tsx`.
2. Confirm the tests pass.
3. Verify that the project compiles cleanly using `npm run build` or `npx tsc --noEmit`.
