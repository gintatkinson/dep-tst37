import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Component Integration Test', () => {
  it('renders the entire App and verifies it loads the default "earth" reference frame and topology map without throwing any errors', async () => {
    render(<App />);

    // Wait until the loading state disappears
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    // Verify the layout wrapper and elements are rendered
    expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
    expect(screen.getByTestId('property-grid-form')).toBeInTheDocument();
    expect(screen.getByTestId('topology-map')).toBeInTheDocument();

    // Verify that the default astronomicalBody value in the form input is "earth"
    const input = screen.getByLabelText('Astronomical Body') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('earth');

    // Verify TabbedContainer integration
    expect(screen.getByTestId('tabbed-container')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-properties')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-elements')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-alarms')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-events')).toBeInTheDocument();

    // Click on Elements tab and verify elements table is displayed
    const elementsTab = screen.getByTestId('tab-button-elements');
    fireEvent.click(elementsTab);
    expect(screen.getByTestId('table-elements')).toBeInTheDocument();
    expect(screen.queryByTestId('property-grid-form')).not.toBeInTheDocument();

    // Click back to Properties tab
    const propertiesTab = screen.getByTestId('tab-button-properties');
    fireEvent.click(propertiesTab);
    expect(screen.getByTestId('property-grid-form')).toBeInTheDocument();
  });
});
