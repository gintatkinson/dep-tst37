import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component Integration Test', () => {
  it('renders the entire App and verifies it loads the default "earth" reference frame without throwing any errors', async () => {
    render(<App />);

    // Wait until the loading state disappears
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    // Verify the layout wrapper and elements are rendered
    expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
    expect(screen.getByTestId('property-grid-form')).toBeInTheDocument();

    // Verify that the default astronomicalBody value in the form input is "earth"
    const input = screen.getByLabelText('Astronomical Body') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('earth');
  });
});
