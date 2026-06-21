import React, { useMemo } from 'react';
import { MockGeoLocationRepository } from './persistence/mock-repository';
import { GeoLocationProvider } from './context/GeoLocationContext';
import { Layout as SidebarLayout } from './components/layout';
import { PropertyGrid } from './components/property-grid';

/**
 * Root Application Component.
 * Instantiates the MockGeoLocationRepository, wraps the layout with the GeoLocationProvider,
 * and renders the main SidebarLayout containing the PropertyGrid.
 *
 * @returns {React.ReactElement} The rendered React application root.
 */
function App(): React.ReactElement {
  const repository = useMemo(() => new MockGeoLocationRepository(), []);

  return (
    <GeoLocationProvider repository={repository}>
      <SidebarLayout>
        <PropertyGrid />
      </SidebarLayout>
    </GeoLocationProvider>
  );
}

export default App;
