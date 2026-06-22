# Implementation Plan - Layout & Components Integration

This implementation plan details the target changes to configure the bottom-docked TabbedContainer, high-density TableViews, dynamic header theme controls, and token-driven CSS styles for the React application.

## Proposed Changes

### 1. Tabbed Container
- **Target Files:**
  - `web_react/src/components/tabbed-container.tsx` (Create)
  - `web_react/src/components/tabbed-container.module.css` (Create)
- **Changes:**
  - Implement `<TabbedContainer>` representing four tabs: "Properties", "Elements", "Alarms", "Events".
  - Tab buttons are positioned at the bottom of the container.
  - Active tab is tracked via state; its content is rendered above the tab bar.
  - Active tab styling uses dynamic CSS custom properties: `var(--theme-active-border)`, `var(--theme-active-bg)`, and `var(--theme-active-text)`.

### 2. High-Density Table View
- **Target Files:**
  - `web_react/src/components/table-view.tsx` (Create)
  - `web_react/src/components/table-view.module.css` (Create)
- **Changes:**
  - Implement a high-density, outlined `<TableView>` component with a `min-height: 32px` constraint on table rows and `4px` padding.
  - Render specific columns and styling based on active tab type:
    - **Elements**: Object (SVG icon representing node type), Name, Type (e.g. BTS, BSC), Primary State, Alarms Summary.
    - **Alarms**: Severity (badge with red/orange/yellow bg), Target, Type, Description, Timestamp.
    - **Events**: Event ID, Type, Description, Timestamp.
  - Mock data is populated based on active geo-location or reference frame context:
    - Elements: BTS22 (BTS, Operational:Enabled, 1 M+), London (BSC, Operational:Enabled, 1 m), BTS11 (BTS, Operational:Enabled, 4 W)
    - Alarms: Critical (M+): BTS22 - "Alarm 3_ - Antenna degraded", Minor (m): London - "Cooling fan degraded", Warning (W): BTS11 - "Low signal warning"
    - Events: EV001: "Reference Frame config modified", EV002: "Datum set to WGS-84"

### 3. Dynamic Header Theme UI Controls & Brand Title
- **Target Files:**
  - `web_react/src/components/header.tsx` (Update)
  - `web_react/src/components/header.module.css` (Update)
- **Changes:**
  - Load design tokens from `../../../.pipeline/logical-ui/design-tokens.json`.
  - Replace the hardcoded "Google Cloud" brand name with `designTokens.branding["console-title"]`.
  - Add theme selection buttons (Light, Dark, System) in the right section using `useTheme` hook, toggling state and marking the selected one as active.
  - Ensure header background/borders/text styles use dynamic CSS custom properties instead of hardcoded hex values.

### 4. Details Pane Layout Integration
- **Target Files:**
  - `web_react/src/components/layout.tsx` (Update)
  - `web_react/src/components/layout.module.css` (Update)
- **Changes:**
  - Integrate `<TabbedContainer>` in the details pane of `<Layout>`.
  - Render `<PropertyGrid activeView={activeView} />` under "Properties".
  - Render `<TableView type="..." />` for "Elements", "Alarms", and "Events" tabs.
  - Replace hardcoded color variables/hex values in layouts and splitters CSS with CSS variables.

### 5. Token-Driven CSS Refactoring
- **Target Files:**
  - `web_react/src/components/property-grid.module.css` (Update)
  - `web_react/src/components/topology-map.module.css` (Update)
- **Changes:**
  - Map all hardcoded colors, borders, shadows, and status badges to dynamic CSS variables: `var(--theme-card-bg)`, `var(--theme-label-color)`, `var(--theme-input-border)`, `var(--theme-button-bg)`, `var(--theme-button-hover-bg)`, etc.

### 6. Unit & Integration Testing
- **Target Files:**
  - `web_react/src/test/components.test.tsx` (Update)
  - `web_react/src/test/App.test.tsx` (Update)
  - `web_react/src/test/theme.test.tsx` (Update)
- **Changes:**
  - Add assertions verifying header brand title loads from design tokens.
  - Verify theme buttons toggle theme via context.
  - Verify TabbedContainer renders bottom-docked tabs and switches panels correctly.
  - Verify TableView renders correct columns, rows, labels, and badges.
  - Remove unused React import from `theme.test.tsx` to fix TypeScript compilation error.

## Verification & Testing Plan
1. Run `npm run test` to verify all components and integrations pass unit tests.
2. Run `npm run build` to verify clean production compile.
