import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Layout } from '../components/layout';
import { PropertyGrid } from '../components/property-grid';
import { useGeoLocation } from '../context/GeoLocationContext';
import { DomainValidationError } from '../domain/validation';
import layoutStyles from '../components/layout.module.css';

// Mock the GeoLocationContext hook
vi.mock('../context/GeoLocationContext', () => ({
  useGeoLocation: vi.fn(),
}));

describe('Layout Component', () => {
  beforeEach(() => {
    // Inject styles for JSDOM style testing
    const style = document.createElement('style');
    style.id = 'layout-test-styles';
    style.innerHTML = `
      .${layoutStyles.wrapper} {
        display: flex;
        flex-direction: row;
        height: 100%;
        width: 100%;
      }
      .${layoutStyles.sidebar} {
        display: flex;
        flex-direction: column;
        min-width: 240px;
        flex-shrink: 0;
        overflow-y: auto;
      }
      .${layoutStyles.splitter} {
        contain: layout paint;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById('layout-test-styles');
      if (existing) {
        existing.remove();
      }
    };
  });

  it('should enforce flex row layout, full height and width on the outer wrapper', () => {
    render(<Layout />);
    const wrapper = screen.getByTestId('layout-wrapper');
    expect(wrapper).toBeInTheDocument();
    
    const computed = window.getComputedStyle(wrapper);
    expect(computed.display).toBe('flex');
    expect(computed.flexDirection).toBe('row');
    expect(computed.height).toBe('100%');
    expect(computed.width).toBe('100%');
  });

  it('should have a sidebar navigation tree with vertical column layout, min-width 240px, flex-shrink 0, and overflow-y auto', () => {
    render(<Layout />);
    const sidebar = screen.getByTestId('sidebar-nav');
    expect(sidebar).toBeInTheDocument();

    const computed = window.getComputedStyle(sidebar);
    expect(computed.display).toBe('flex');
    expect(computed.flexDirection).toBe('column');
    expect(computed.minWidth).toBe('240px');
    expect(computed.flexShrink).toBe('0');
    expect(computed.overflowY).toBe('auto');
  });

  it('should have a layout splitter container that isolates reflows using CSS containment', () => {
    render(<Layout />);
    const splitter = screen.getByTestId('layout-splitter');
    expect(splitter).toBeInTheDocument();

    const computed = window.getComputedStyle(splitter);
    expect(computed.contain).toBe('layout paint');
  });

  it('should use nested ul/ol inside li for valid HTML nesting in the navigation tree', () => {
    render(<Layout />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // Find all uls inside the nav
    const uls = nav.querySelectorAll('ul, ol');
    expect(uls.length).toBeGreaterThan(1); // Should have outer and nested list(s)

    // Verify nested uls/ols are strictly children of li
    uls.forEach((list) => {
      const parent = list.parentElement;
      if (parent && parent.parentNode && parent.tagName !== 'NAV') {
        expect(parent.tagName).toBe('LI');
      }
    });
  });
});

describe('PropertyGrid Component', () => {
  const mockSaveFrame = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input fields for all parameters', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      referenceFrame: {
        astronomicalBody: 'earth',
        alternateSystem: 'alt-1',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: 0.5,
          heightAccuracy: 1.2,
        },
      },
      loading: false,
      error: null,
      saveFrame: mockSaveFrame,
    });

    render(<PropertyGrid />);

    const astronomicalBodyInput = screen.getByLabelText(/Astronomical Body/i);
    const alternateSystemInput = screen.getByLabelText(/Alternate System/i);
    const geodeticDatumInput = screen.getByLabelText(/Geodetic Datum/i);
    const coordAccuracyInput = screen.getByLabelText(/Coordinate Accuracy/i);
    const heightAccuracyInput = screen.getByLabelText(/Height Accuracy/i);

    expect(astronomicalBodyInput).toHaveValue('earth');
    expect(alternateSystemInput).toHaveValue('alt-1');
    expect(geodeticDatumInput).toHaveValue('wgs-84');
    expect(coordAccuracyInput).toHaveValue(0.5);
    expect(heightAccuracyInput).toHaveValue(1.2);
  });

  it('should display validation errors under the corresponding input fields', () => {
    const validationError = new DomainValidationError([
      {
        type: 'constraint-violation',
        path: '/reference-frame/astronomical-body',
        message: 'Invalid characters in astronomical body name.',
      },
      {
        type: 'constraint-violation',
        path: '/reference-frame/geodetic-system/geodetic-datum',
        message: 'Invalid characters in geodetic datum.',
      },
      {
        type: 'constraint-violation',
        path: '/reference-frame/geodetic-system/coord-accuracy',
        message: 'Coordinate accuracy must be a number.',
      },
      {
        type: 'constraint-violation',
        path: '/reference-frame/geodetic-system/height-accuracy',
        message: 'Height accuracy must be a number.',
      },
    ]);

    vi.mocked(useGeoLocation).mockReturnValue({
      referenceFrame: {
        astronomicalBody: 'EARTH',
        alternateSystem: '',
        geodeticSystem: {
          geodeticDatum: 'wgs 84',
        },
      },
      loading: false,
      error: validationError,
      saveFrame: mockSaveFrame,
    });

    render(<PropertyGrid />);

    const bodyError = screen.getByTestId('error-astronomicalBody');
    const datumError = screen.getByTestId('error-geodeticDatum');
    const coordError = screen.getByTestId('error-coordAccuracy');
    const heightError = screen.getByTestId('error-heightAccuracy');

    expect(bodyError).toBeInTheDocument();
    expect(bodyError).toHaveTextContent('Invalid characters in astronomical body name.');
    // Check style/color - e.g. class containing error
    expect(bodyError.className).toContain('errorMessage');

    expect(datumError).toBeInTheDocument();
    expect(datumError).toHaveTextContent('Invalid characters in geodetic datum.');

    expect(coordError).toBeInTheDocument();
    expect(coordError).toHaveTextContent('Coordinate accuracy must be a number.');

    expect(heightError).toBeInTheDocument();
    expect(heightError).toHaveTextContent('Height accuracy must be a number.');
  });

  it('should trigger repository save on input blur', async () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      referenceFrame: {
        astronomicalBody: 'earth',
        alternateSystem: '',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
        },
      },
      loading: false,
      error: null,
      saveFrame: mockSaveFrame,
    });

    render(<PropertyGrid />);

    const input = screen.getByLabelText(/Astronomical Body/i);
    fireEvent.change(input, { target: { value: 'mars' } });
    fireEvent.blur(input);

    expect(mockSaveFrame).toHaveBeenCalledWith({
      astronomicalBody: 'mars',
      alternateSystem: undefined,
      geodeticSystem: {
        geodeticDatum: 'wgs-84',
        coordAccuracy: undefined,
        heightAccuracy: undefined,
      },
    });
  });

  it('should trigger repository save on form submission', async () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      referenceFrame: {
        astronomicalBody: 'earth',
        alternateSystem: '',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
        },
      },
      loading: false,
      error: null,
      saveFrame: mockSaveFrame,
    });

    render(<PropertyGrid />);

    const input = screen.getByLabelText(/Alternate System/i);
    fireEvent.change(input, { target: { value: 'alt-new' } });

    const form = screen.getByTestId('property-grid-form');
    fireEvent.submit(form);

    expect(mockSaveFrame).toHaveBeenCalledWith({
      astronomicalBody: 'earth',
      alternateSystem: 'alt-new',
      geodeticSystem: {
        geodeticDatum: 'wgs-84',
        coordAccuracy: undefined,
        heightAccuracy: undefined,
      },
    });
  });
});
