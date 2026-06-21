# Feature 2 Solution Walkthrough

This document outlines the cumulative solution design and implementation details for Feature 2 (IETF NI Geographic Position/Location management UI, coordinate projection map, resizable Split Workspace layout, and coordinate choice/validation logic).

## Summary of Changes

1. **Domain Model Extensions**:
   - Defined TypeScript structures mapping the geographic location schemas including [EllipsoidLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L17-L30), [CartesianLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L36-L49), [LocationChoice](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L56-L59), and [GeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L65-L68) interfaces in [types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts).
   - Supported high-precision float validation constraints (16-decimal precision for ellipsoidal latitude/longitude, and 6-decimal precision for heights and Cartesian x/y/z coordinate parameters).

2. **Validation & Normalization Rules**:
   - Implemented [validateGeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts#L214-L485) and [getDefaultGeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts#L490-L500) functions in [validation.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts).
   - Enforced mutual exclusivity of coordinates (exactly one of `ellipsoid` or `cartesian` must be defined).
   - Validated bounds for ellipsoidal coordinates (latitude range `[-90, 90]` and longitude range `[-180, 180]`).
   - Integrated utility to check decimal precision dynamically for both string and number inputs.

3. **Persistence Layer Integration**:
   - Defined the [GeoLocationRepository](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/repository.ts#L3-L6) interface containing standard save and load signatures.
   - Built the [MockGeoLocationRepository](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/mock-repository.ts#L5-L19) class which validates objects before serializing them, utilizing standard local storage caching mechanics.

4. **Context & React Hooks**:
   - Developed [GeoLocationProvider](file:///Users/perkunas/jail/dep-tst37/web_react/src/context/GeoLocationContext.tsx#L20-L61) and [useGeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/context/GeoLocationContext.tsx#L63-L69) custom hook.
   - Propagated asynchronous loading, saving, and error states throughout the components.

5. **SVG Projection Map Component**:
   - Constructed the [TopologyMap](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/topology-map.tsx) component rendering an SVG-based coordinate grid standardizing on the 8px grid system.
   - Coded mathematical projections to map ellipsoidal (latitude/longitude) and Cartesian (x/y/z) ECEF coordinates onto a 2D isometric representation.
   - Added interactive overlay visual elements, such as crosshair lines, center dots, animated pulsing rings, and dynamic text tags displaying coordinates.

6. **Resizable Split Workspace Layout**:
   - Refactored [Layout](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/layout.tsx) component using pointer events setPointerCapture/releasePointerCapture for smooth and lagging-free drag-to-resize sidebar navigation and vertical workspace splits.
   - Configured layout containment properties (`contain: layout paint`) in [layout.module.css](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/layout.module.css) to optimize rendering and avoid document-wide reflows.

7. **Property Grid Coordinate Toggling**:
   - Updated [PropertyGrid](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/property-grid.tsx) component to support dynamic coordinate selection.
   - Bound inputs to auto-save and validate on form field blur, highlighting precise errors for violating constraints.

---

## Code Realization Table

| UML Class / Component | Attribute / Operation | Target File | Class / Function / Hook |
| --- | --- | --- | --- |
| EllipsoidLocation | latitude, longitude, height | [web_react/src/domain/types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts) | [EllipsoidLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L17) interface |
| CartesianLocation | x, y, z | [web_react/src/domain/types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts) | [CartesianLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L36) interface |
| LocationChoice | ellipsoid, cartesian | [web_react/src/domain/types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts) | [LocationChoice](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L56) interface |
| GeoLocation | referenceFrame, location | [web_react/src/domain/types.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts) | [GeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/types.ts#L65) interface |
| GeoLocation | validateGeoLocation, getDefaultGeoLocation | [web_react/src/domain/validation.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts) | [validateGeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts#L214), [getDefaultGeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/domain/validation.ts#L490) |
| GeoLocationRepository | save, load | [web_react/src/persistence/repository.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/repository.ts) | [GeoLocationRepository](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/repository.ts#L3) interface |
| MockGeoLocationRepository | save, load | [web_react/src/persistence/mock-repository.ts](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/mock-repository.ts) | [MockGeoLocationRepository](file:///Users/perkunas/jail/dep-tst37/web_react/src/persistence/mock-repository.ts#L5) class |
| GeoLocationProvider | saveGeoLocation, useGeoLocation | [web_react/src/context/GeoLocationContext.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/context/GeoLocationContext.tsx) | [GeoLocationProvider](file:///Users/perkunas/jail/dep-tst37/web_react/src/context/GeoLocationContext.tsx#L20), [useGeoLocation](file:///Users/perkunas/jail/dep-tst37/web_react/src/context/GeoLocationContext.tsx#L63) |
| TopologyMap | coordinate projection & SVG rendering | [web_react/src/components/topology-map.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/topology-map.tsx) | [TopologyMap](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/topology-map.tsx#L13) component |
| SplitWorkspace | vertical dragging & layout resizing | [web_react/src/components/layout.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/layout.tsx) | [Layout](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/layout.tsx#L17) component |
| PropertyGrid | coordinate toggling, blur validation | [web_react/src/components/property-grid.tsx](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/property-grid.tsx) | [PropertyGrid](file:///Users/perkunas/jail/dep-tst37/web_react/src/components/property-grid.tsx#L16) component |

---

## Verification Proof

The unit and integration test suite has been successfully executed with 47 passing tests. Below is the raw console output from `vitest run`:

```
> web_react@0.0.0 test
> vitest run


 RUN  v4.1.9 /Users/perkunas/jail/dep-tst37/web_react

 ✓ src/test/domain.test.ts (20 tests) 5ms
 ✓ src/test/persistence.test.tsx (8 tests) 36ms
 ✓ src/test/App.test.tsx (1 test) 90ms
 ✓ src/test/components.test.tsx (18 tests) 216ms

 Test Files  4 passed (4)
      Tests  47 passed (47)
   Start at  01:01:12
   Duration  1.28s (transform 337ms, setup 367ms, import 480ms, tests 347ms, environment 2.56s)
```

---

## Manual Testing Instructions

To verify the validation constraints, resizable splits, projection map, and component functionalities locally:

1. **Launch the Development Server**:
   Navigate to the `web_react` directory and start the dev server:
   ```bash
   cd web_react
   npm run dev
   ```

2. **Open the Web Application**:
   Navigate to the URL displayed in the terminal (typically `http://localhost:5173`).

3. **Verify Resizable Split Workspace**:
   - Hover the mouse cursor over the splitter bar separating the topology map pane and details property grid pane. The cursor will change to a vertical resize pointer (`row-resize`).
   - Drag vertically to adjust the heights. Verify both panes update their dimensions fluidly.
   - Hover the cursor over the left navigation bar border. Drag horizontally to resize the sidebar tree.

4. **Verify Coordinate Toggling & Exclusivity**:
   - Locate the **Coordinate Type** dropdown inside the details pane. It defaults to `Ellipsoid`.
   - Modify the coordinate selection to `Cartesian`. Notice that the ellipsoidal input fields (Latitude, Longitude, Height) disappear and Cartesian coordinate input fields (X, Y, Z) are displayed.
   - Switch the selection back to `Ellipsoid`. The Cartesian coordinate values are cleared and ellipsoidal inputs are restored, confirming coordinate exclusivity.

5. **Verify Precision & Bounds Constraints**:
   - In `Ellipsoid` mode, input a latitude value of `120` (outside `[-90, 90]`) or a value with incorrect decimal precision (e.g., `45.123` or `45.12345678901234567`). Click out of the field to trigger blur validation. An error message indicating the constraints violation will be displayed.
   - Correct the latitude to `45.0000000000000000` (exactly 16 decimals) and longitude to `90.0000000000000000` (exactly 16 decimals). The error messages will clear.
   - Switch to `Cartesian` mode. Input non-numeric text or float values with more or fewer than 6 decimal places. Trigger blur validation and verify the field-specific error messages.

6. **Verify Dynamic SVG Map Projection**:
   - With valid ellipsoidal coordinates (e.g., Latitude `45.0000000000000000`, Longitude `90.0000000000000000`), click **Save** or trigger blur. Verify the **Geographic Position Map** plots a glowing crosshair target with projected coordinate values on the SVG grid.
   - Switch to `Cartesian` mode, input valid coordinates (e.g., X `1000000.000000`, Y `1000000.000000`, Z `2000000.000000`), save, and verify that the target indicator updates its location on the isometric 3D-to-2D projected grid.

7. **Verify Persistence**:
   - Save a set of valid coordinates.
   - Refresh the page and confirm that all values, coordinate selections, and reference frame parameters are correctly loaded from persistent local storage.
