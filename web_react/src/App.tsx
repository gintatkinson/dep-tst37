import React, { useMemo, useState } from 'react';
import { MockGeoLocationRepository } from './persistence/mock-repository';
import { GeoLocationProvider } from './context/GeoLocationContext';
import { Layout as SidebarLayout } from './components/layout';
import { PropertyGrid } from './components/property-grid';
import designTokens from '../../.pipeline/logical-ui/design-tokens.json';

/**
 * Root Application Component.
 * Instantiates the MockGeoLocationRepository, wraps the layout with the GeoLocationProvider,
 * and renders the main SidebarLayout containing the PropertyGrid.
 *
 * @returns {React.ReactElement} The rendered React application root.
 */
function App(): React.ReactElement {
  const repository = useMemo(() => new MockGeoLocationRepository(), []);
  const [activeView, setActiveView] = useState<'geodetic' | 'alternate' | 'all'>('all');

  return (
    <GeoLocationProvider repository={repository}>
      <SidebarLayout
        activeView={activeView}
        onViewChange={setActiveView}
        spacing={designTokens.spacing}
      >
        <PropertyGrid activeView={activeView} />
      </SidebarLayout>
    </GeoLocationProvider>
  );
}

export default App;
