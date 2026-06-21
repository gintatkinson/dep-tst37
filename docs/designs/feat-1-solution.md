# Feature 1 Solution Walkthrough

This document outlines the cumulative solution design and implementation details for Feature 1 (IETF NI Location configuration management UI and domain layers).

## Summary of Changes

1. **Vitest Setup & Test Infrastructure**:
   - Integrated Vitest test runner for validation, state, rendering, and persistence layers.
   - Configured tests to run in a JSDOM environment to allow React component testing.

2. **Domain Model Types**:
   - Defined TypeScript structures mapping the geographic location schemas including `ReferenceFrame` and `GeodeticSystem`.
   - Enabled options for alternate reference system configure flags and astronomical bodies.

3. **Validation & Normalization Rules**:
   - Enforced strict constraints on coordinate parameters:
     - Coordinate accuracy and height accuracy must have a maximum of 6-decimal precision.
     - Alternate system coordinate identifier codes must strictly adhere to the printable ASCII character set (excluding uppercase letters).
   - Structured normalization pipeline to reject malformed input values.

4. **Persistence & Dependency Injection**:
   - Established the `GeoLocationRepository` contract.
   - Built a robust `MockGeoLocationRepository` implementing standard `localStorage` caching mechanics to facilitate standalone offline mode.
   - Implemented dependency injection using a React context provider (`GeoLocationProvider`) and custom hooks for component consumption.

5. **Aesthetics & Performance Layouts**:
   - Constructed a high-density, performant `PropertyGrid` component designed with strict CSS layout paint containment to optimize rendering cycle costs.
   - Implemented a clean, premium visual `SidebarLayout` featuring responsive alignment and sidebar controls.

---

## Code Realization Table

| UML Class / Component | Attribute / Operation | Target File | Class / Function / Hook |
| --- | --- | --- | --- |
| ReferenceFrame | alternateSystem, astronomicalBody | [web_react/src/domain/types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts) | ReferenceFrame interface |
| ReferenceFrame | configureAlternateSystem | [web_react/src/domain/validation.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts) | validateReferenceFrame |
| GeodeticSystem | geodeticDatum, coordAccuracy, heightAccuracy | [web_react/src/domain/types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts) | GeodeticSystem interface |
| GeodeticSystem | applyDatumOverride | [web_react/src/domain/validation.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts) | validateReferenceFrame |
| GeoLocationRepository | getReferenceFrame, saveReferenceFrame | [web_react/src/persistence/repository.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/repository.ts) | GeoLocationRepository interface |
| MockGeoLocationRepository | getReferenceFrame, saveReferenceFrame | [web_react/src/persistence/mock-repository.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/mock-repository.ts) | MockGeoLocationRepository class |
| GeoLocationProvider | saveFrame | [web_react/src/context/GeoLocationContext.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/context/GeoLocationContext.tsx) | useGeoLocation hook |
| PropertyGrid | render / edit attributes | [web_react/src/components/property-grid.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/property-grid.tsx) | PropertyGrid component |
| SidebarLayout | outer grid Shell | [web_react/src/components/layout.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/layout.tsx) | SidebarLayout component |

---

## Verification Proof

The unit and integration test suite has been successfully executed with 22 passing tests. Below is the raw console output from `npm run test`:

```
> web_react@0.0.0 test
> vitest run


 RUN  v4.1.9 /Users/perkunas/jail/dep-tst37/web_react

 ✓ src/test/domain.test.ts (7 tests) 4ms
 ✓ src/test/App.test.tsx (1 test) 36ms
 ✓ src/test/persistence.test.tsx (6 tests) 42ms
 ✓ src/test/components.test.tsx (8 tests) 131ms

 Test Files  4 passed (4)
      Tests  22 passed (22)
   Start at  20:54:55
   Duration  1.15s (transform 246ms, setup 347ms, import 413ms, tests 212ms, environment 2.45s)
```

---

## Manual Testing Instructions

To verify the validation constraints and component functionalities locally:

1. **Launch the Development Server**:
   Navigate to the `web_react` directory and start the dev server:
   ```bash
   cd web_react
   npm run dev
   ```

2. **Open the Web Application**:
   Navigate to the URL displayed in the terminal (typically `http://localhost:5173`).

3. **Test Validation Constraints**:
   - **ASCII & Uppercase check**: Locate the input field for **Alternate System**. Attempt to type or paste uppercase letters (e.g., `WGS84`). You should see a validation error or rejection of the input, as only lowercase printable ASCII characters (and numbers/symbols) are allowed.
   - **Decimal Precision limit**: Locate the input fields for **Coordinate Accuracy** or **Height Accuracy**. Enter a value with more than 6 decimal places (e.g., `0.1234567`). The interface should trigger a validation error indicating that values are limited to 6-decimal precision.
   - **Save & Load (Persistence)**: Modify the reference frame properties and click **Save**. Reload the browser tab. The form fields should retain your updated values, verifying that `MockGeoLocationRepository` correctly cached the state in the browser's local storage.
