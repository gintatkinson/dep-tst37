import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Layout } from '../components/layout';
import { Header } from '../components/header';
import { PropertyGrid } from '../components/property-grid';
import { TopologyMap } from '../components/topology-map';
import { TabbedContainer } from '../components/tabbed-container';
import { TableView } from '../components/table-view';
import { useGeoLocation } from '../context/GeoLocationContext';
import { DomainValidationError } from '../domain/validation';
import layoutStyles from '../components/layout.module.css';

// Mock the GeoLocationContext hook
vi.mock('../context/GeoLocationContext', () => ({
  useGeoLocation: vi.fn(),
}));

const mockSetTheme = vi.fn();
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }),
}));

describe('Layout Component', () => {
  beforeEach(() => {
    // Mock pointer capture methods which aren't fully implemented in JSDOM
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();

    // Inject styles for JSDOM style testing
    const style = document.createElement('style');
    style.id = 'layout-test-styles';
    style.innerHTML = `
      .${layoutStyles.wrapper} {
        display: flex;
        flex-direction: var(--layout-direction, row);
        height: 100%;
        width: 100%;
        contain: layout paint;
      }
      .${layoutStyles.sidebar} {
        display: flex;
        flex-direction: column;
        width: var(--sidebar-width, var(--layout-sidebar-width, 280px));
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

  it('should enforce flex row layout, full height and width, and containment on the outer wrapper', () => {
    // Mock GeoLocation context for TopologyMap which is nested inside Layout
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(<Layout />);
    const wrapper = screen.getByTestId('layout-wrapper');
    expect(wrapper).toBeInTheDocument();
    
    const computed = window.getComputedStyle(wrapper);
    expect(computed.display).toBe('flex');
    expect(computed.flexDirection).toBe('var(--layout-direction, row)');
    expect(computed.height).toBe('100%');
    expect(computed.width).toBe('100%');
    expect(computed.contain).toBe('layout paint');
  });

  it('should have a sidebar navigation tree with vertical column layout, width from CSS variable, flex-shrink 0, and overflow-y auto', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    const mockSpacing = {
      'layout-min-pane-size': '150px',
      'layout-sidebar-width': '280px',
    };
    render(<Layout spacing={mockSpacing} />);
    const sidebar = screen.getByTestId('sidebar-nav');
    expect(sidebar).toBeInTheDocument();

    const wrapper = screen.getByTestId('layout-wrapper');
    expect(wrapper).toHaveStyle('--layout-min-pane-size: 150px');
    expect(wrapper).toHaveStyle('--layout-sidebar-width: 280px');

    const computed = window.getComputedStyle(sidebar);
    expect(computed.display).toBe('flex');
    expect(computed.flexDirection).toBe('column');
    expect(computed.width).toBe('var(--sidebar-width, var(--layout-sidebar-width, 280px))');
    expect(computed.flexShrink).toBe('0');
    expect(computed.overflowY).toBe('auto');
  });

  it('should have a layout splitter container that isolates reflows using CSS containment', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(<Layout />);
    const splitter = screen.getByTestId('layout-splitter');
    expect(splitter).toBeInTheDocument();

    const computed = window.getComputedStyle(splitter);
    expect(computed.contain).toBe('layout paint');
  });

  it('should use nested ul/ol inside li for valid HTML nesting in the navigation tree', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

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

  it('should update sidebar width on pointer drag within boundaries and clamp accordingly', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    const mockSpacing = {
      'layout-min-pane-size': '150px',
      'layout-sidebar-width': '280px',
    };

    render(<Layout spacing={mockSpacing} />);
    const wrapper = screen.getByTestId('layout-wrapper');
    const splitter = screen.getByTestId('layout-splitter');

    // Verify style properties on wrapper
    expect(wrapper).toHaveStyle('--layout-min-pane-size: 150px');
    expect(wrapper).toHaveStyle('--layout-sidebar-width: 280px');

    // Mock bounding rect for wrapper
    wrapper.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
    });

    // Start drag
    fireEvent.pointerDown(splitter, { pointerId: 1 });
    expect(splitter.setPointerCapture).toHaveBeenCalledWith(1);

    // Move within bounds (e.g. 300px)
    fireEvent.pointerMove(splitter, { pointerId: 1, clientX: 300 });
    expect(wrapper).toHaveStyle('--sidebar-width: 300px');

    // Move below minimum bounds (e.g. 100px) - should clamp to 150px (spacing.layout-min-pane-size)
    fireEvent.pointerMove(splitter, { pointerId: 1, clientX: 100 });
    expect(wrapper).toHaveStyle('--sidebar-width: 150px');

    // Move above maximum bounds (e.g. 700px) - should clamp to 600px
    fireEvent.pointerMove(splitter, { pointerId: 1, clientX: 700 });
    expect(wrapper).toHaveStyle('--sidebar-width: 600px');

    // End drag
    fireEvent.pointerUp(splitter, { pointerId: 1 });
    expect(splitter.releasePointerCapture).toHaveBeenCalledWith(1);

    // Moves after release should not change style
    fireEvent.pointerMove(splitter, { pointerId: 1, clientX: 400 });
    expect(wrapper).toHaveStyle('--sidebar-width: 600px');
  });

  it('should update workspace split (topology pane height) on pointer drag within boundaries and clamp accordingly', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    const mockSpacing = {
      'layout-min-pane-size': '150px',
      'layout-sidebar-width': '280px',
    };

    render(<Layout spacing={mockSpacing} />);
    const mainWorkspace = screen.getByTestId('workspace-content');
    const splitter = screen.getByTestId('workspace-splitter');
    const wrapper = screen.getByTestId('layout-wrapper');

    // Verify style properties on wrapper
    expect(wrapper).toHaveStyle('--layout-min-pane-size: 150px');
    expect(wrapper).toHaveStyle('--layout-sidebar-width: 280px');

    // Case 1: Workspace height is 800px
    mainWorkspace.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 260,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 740,
      height: 800,
    });

    // Start drag
    fireEvent.pointerDown(splitter, { pointerId: 2 });
    expect(splitter.setPointerCapture).toHaveBeenCalledWith(2);

    // Move within bounds (e.g. 350px)
    fireEvent.pointerMove(splitter, { pointerId: 2, clientY: 350 });
    expect(wrapper).toHaveStyle('--topology-height: 350px');

    // Move below minimum bounds (e.g. 100px) - should clamp to 150px
    fireEvent.pointerMove(splitter, { pointerId: 2, clientY: 100 });
    expect(wrapper).toHaveStyle('--topology-height: 150px');

    // Move above maximum bounds (e.g. 700px) - should clamp to 650px (800 - 150)
    fireEvent.pointerMove(splitter, { pointerId: 2, clientY: 700 });
    expect(wrapper).toHaveStyle('--topology-height: 650px');

    // End drag
    fireEvent.pointerUp(splitter, { pointerId: 2 });
    expect(splitter.releasePointerCapture).toHaveBeenCalledWith(2);

    // Case 2: Workspace height is 1000px
    mainWorkspace.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 260,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 740,
      height: 1000,
    });

    // Start drag
    fireEvent.pointerDown(splitter, { pointerId: 4 });
    expect(splitter.setPointerCapture).toHaveBeenCalledWith(4);

    // Move within bounds up to 850px (e.g. 800px) - should be 800px
    fireEvent.pointerMove(splitter, { pointerId: 4, clientY: 800 });
    expect(wrapper).toHaveStyle('--topology-height: 800px');

    // Move above maximum bounds (e.g. 900px) - should clamp to 850px (1000 - 150)
    fireEvent.pointerMove(splitter, { pointerId: 4, clientY: 900 });
    expect(wrapper).toHaveStyle('--topology-height: 850px');

    // End drag
    fireEvent.pointerUp(splitter, { pointerId: 4 });
    expect(splitter.releasePointerCapture).toHaveBeenCalledWith(4);
  });

  it('should preserve input focus and DOM state when split workspace is resized', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(
      <Layout>
        <input data-testid="test-input" defaultValue="test-value" />
      </Layout>
    );
    const input = screen.getByTestId('test-input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('test-value');

    // Perform resize drag
    const splitter = screen.getByTestId('workspace-splitter');
    fireEvent.pointerDown(splitter, { pointerId: 3 });
    fireEvent.pointerMove(splitter, { pointerId: 3, clientY: 300 });
    fireEvent.pointerUp(splitter, { pointerId: 3 });

    // Assert DOM state (focus and value) is preserved
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('test-value');
  });

  it('should trigger onViewChange callback with correct view name when navigation spans are clicked', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    const onViewChangeMock = vi.fn();
    render(<Layout activeView="all" onViewChange={onViewChangeMock} />);

    const sidebar = screen.getByTestId('sidebar-nav');
    const geodeticSpan = within(sidebar).getByText('Geodetic System');
    const alternateSpan = within(sidebar).getByText('Alternate System');

    fireEvent.click(geodeticSpan);
    expect(onViewChangeMock).toHaveBeenCalledWith('geodetic');

    fireEvent.click(alternateSpan);
    expect(onViewChangeMock).toHaveBeenCalledWith('alternate');
  });

  it('should conditionally append active class name to the active view span', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    const { rerender } = render(<Layout activeView="geodetic" />);
    let sidebar = screen.getByTestId('sidebar-nav');
    let geodeticSpan = within(sidebar).getByText('Geodetic System');
    let alternateSpan = within(sidebar).getByText('Alternate System');

    expect(geodeticSpan.className).toContain('active');
    expect(alternateSpan.className).not.toContain('active');

    rerender(<Layout activeView="alternate" />);
    sidebar = screen.getByTestId('sidebar-nav');
    geodeticSpan = within(sidebar).getByText('Geodetic System');
    alternateSpan = within(sidebar).getByText('Alternate System');
    expect(geodeticSpan.className).not.toContain('active');
    expect(alternateSpan.className).toContain('active');
  });
});

describe('PropertyGrid Component', () => {
  const mockSaveGeoLocation = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input fields for all parameters', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: {
          astronomicalBody: 'earth',
          alternateSystem: 'alt-1',
          geodeticSystem: {
            geodeticDatum: 'wgs-84',
            coordAccuracy: 0.5,
            heightAccuracy: 1.2,
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
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
      geoLocation: {
        referenceFrame: {
          astronomicalBody: 'EARTH',
          alternateSystem: '',
          geodeticSystem: {
            geodeticDatum: 'wgs 84',
          },
        },
      },
      loading: false,
      error: validationError,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    const bodyError = screen.getByTestId('error-astronomicalBody');
    const datumError = screen.getByTestId('error-geodeticDatum');
    const coordError = screen.getByTestId('error-coordAccuracy');
    const heightError = screen.getByTestId('error-heightAccuracy');

    expect(bodyError).toBeInTheDocument();
    expect(bodyError).toHaveTextContent('Invalid characters in astronomical body name.');
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
      geoLocation: {
        referenceFrame: {
          astronomicalBody: 'earth',
          alternateSystem: '',
          geodeticSystem: {
            geodeticDatum: 'wgs-84',
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    const input = screen.getByLabelText(/Astronomical Body/i);
    fireEvent.change(input, { target: { value: 'mars' } });
    fireEvent.blur(input);

    expect(mockSaveGeoLocation).toHaveBeenCalledWith({
      referenceFrame: {
        astronomicalBody: 'mars',
        alternateSystem: undefined,
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: undefined,
          heightAccuracy: undefined,
        },
      },
      location: undefined,
    });
  });

  it('should trigger repository save on form submission', async () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: {
          astronomicalBody: 'earth',
          alternateSystem: '',
          geodeticSystem: {
            geodeticDatum: 'wgs-84',
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    const input = screen.getByLabelText(/Alternate System/i);
    fireEvent.change(input, { target: { value: 'alt-new' } });

    const form = screen.getByTestId('property-grid-form');
    fireEvent.submit(form);

    expect(mockSaveGeoLocation).toHaveBeenCalledWith({
      referenceFrame: {
        astronomicalBody: 'earth',
        alternateSystem: 'alt-new',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: undefined,
          heightAccuracy: undefined,
        },
      },
      location: undefined,
    });
  });

  it('should render coordinate type selector and choice-exclusive fields', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: {
            latitude: 37.774929,
            longitude: -122.419416,
            height: 10.123456,
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    const select = screen.getByTestId('coordinate-type-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('ellipsoid');

    expect(screen.getByLabelText('Latitude')).toHaveValue('37.774929');
    expect(screen.getByLabelText('Longitude')).toHaveValue('-122.419416');
    expect(screen.getByLabelText('Height')).toHaveValue('10.123456');

    expect(screen.queryByLabelText('X Coordinate')).not.toBeInTheDocument();
  });

  it('should clear out-of-scope fields and save when selector toggles to cartesian', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: {
            latitude: 37.774929,
            longitude: -122.419416,
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    const select = screen.getByTestId('coordinate-type-select');
    fireEvent.change(select, { target: { value: 'cartesian' } });

    expect(screen.getByLabelText('X Coordinate')).toBeInTheDocument();
    expect(screen.queryByLabelText('Latitude')).not.toBeInTheDocument();

    expect(mockSaveGeoLocation).toHaveBeenCalledWith({
      referenceFrame: {
        astronomicalBody: 'earth',
        alternateSystem: undefined,
        geodeticSystem: undefined,
      },
      location: {
        cartesian: {
          x: undefined,
          y: undefined,
          z: undefined,
        },
      },
    });
  });

  it('should preserve text inputs precision decimals for coordinates', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    const select = screen.getByTestId('coordinate-type-select');
    fireEvent.change(select, { target: { value: 'ellipsoid' } });

    const latitudeInput = screen.getByLabelText('Latitude');
    expect(latitudeInput.tagName).toBe('INPUT');
    expect(latitudeInput).toHaveAttribute('type', 'text');

    fireEvent.change(latitudeInput, { target: { value: '37.7749290000000000' } });
    expect(latitudeInput).toHaveValue('37.7749290000000000');
  });

  it('should display coordinate validation errors', () => {
    const coordErrors = new DomainValidationError([
      {
        type: 'constraint-violation',
        path: '/location',
        message: 'Exactly one of ellipsoid or cartesian must be defined.',
      },
      {
        type: 'constraint-violation',
        path: '/location/ellipsoid/latitude',
        message: 'latitude fraction digits must be at most 16.',
      },
    ]);

    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
      },
      loading: false,
      error: coordErrors,
      saveGeoLocation: mockSaveGeoLocation,
    });

    render(<PropertyGrid />);

    expect(screen.getByTestId('error-coordinateType')).toHaveTextContent('Exactly one of ellipsoid or cartesian must be defined.');
    
    const select = screen.getByTestId('coordinate-type-select');
    fireEvent.change(select, { target: { value: 'ellipsoid' } });
    
    expect(screen.getByTestId('error-latitude')).toHaveTextContent('latitude fraction digits must be at most 16.');
  });

  it('should hide/show fields based on activeView prop', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: {
          astronomicalBody: 'earth',
          alternateSystem: 'alt-1',
          geodeticSystem: {
            geodeticDatum: 'wgs-84',
            coordAccuracy: 0.5,
            heightAccuracy: 1.2,
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: mockSaveGeoLocation,
    });

    const { rerender } = render(<PropertyGrid activeView="geodetic" />);

    // Under geodetic view, alternate system parameter should be hidden
    expect(screen.queryByLabelText(/Alternate System/i)).not.toBeInTheDocument();
    // Geodetic parameters should be visible
    expect(screen.getByLabelText(/Geodetic Datum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Coordinate Accuracy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Height Accuracy/i)).toBeInTheDocument();

    // Rerender with alternate view
    rerender(<PropertyGrid activeView="alternate" />);

    // Under alternate view, alternate system parameter should be visible
    expect(screen.getByLabelText(/Alternate System/i)).toBeInTheDocument();
    // Geodetic parameters should be hidden
    expect(screen.queryByLabelText(/Geodetic Datum/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Coordinate Accuracy/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Height Accuracy/i)).not.toBeInTheDocument();
  });
});

describe('TopologyMap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unconfigured state when there are no coordinates', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
      },
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(<TopologyMap />);
    expect(screen.getByText('Coordinates Unconfigured')).toBeInTheDocument();
    expect(screen.queryByTestId('coordinate-marker')).not.toBeInTheDocument();
  });

  it('renders ellipsoid coordinates correctly when defined', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: {
            latitude: 37.7749290000000000,
            longitude: -122.4194160000000000,
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(<TopologyMap />);
    expect(screen.getByTestId('coordinate-marker')).toBeInTheDocument();
    expect(screen.getByTestId('info-label')).toHaveTextContent('LAT: 37.774929, LON: -122.419416');
  });

  it('renders cartesian coordinates correctly when defined', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          cartesian: {
            x: 1234567.123456,
            y: -7654321.654321,
            z: 0.123456,
          },
        },
      },
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(<TopologyMap />);
    expect(screen.getByTestId('coordinate-marker')).toBeInTheDocument();
    expect(screen.getByTestId('info-label')).toHaveTextContent('X: 1234567.123456, Y: -7654321.654321, Z: 0.123456');
  });
});

describe('Header Component', () => {
  it('renders Google Cloud-style header bar with all elements', () => {
    const onMenuClickMock = vi.fn();
    render(<Header onMenuClick={onMenuClickMock} />);

    expect(screen.getByTestId('gcp-header')).toBeInTheDocument();
    expect(screen.getByText('Network Inventory Location')).toBeInTheDocument();
    expect(screen.getByTestId('project-selector')).toHaveTextContent('ietf-ni-location');
    expect(screen.getByPlaceholderText('Search resources, services, and products')).toBeInTheDocument();
    expect(screen.getByTestId('cloud-shell-button')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-button')).toBeInTheDocument();
    expect(screen.getByTestId('help-button')).toBeInTheDocument();
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toHaveTextContent('G');

    // Click menu toggle
    const toggleButton = screen.getByTestId('menu-toggle-button');
    fireEvent.click(toggleButton);
    expect(onMenuClickMock).toHaveBeenCalled();
  });

  it('renders theme selector buttons and triggers setTheme when clicked', () => {
    render(<Header />);
    const lightButton = screen.getByTestId('theme-toggle-light');
    const darkButton = screen.getByTestId('theme-toggle-dark');
    const systemButton = screen.getByTestId('theme-toggle-system');

    expect(lightButton).toBeInTheDocument();
    expect(darkButton).toBeInTheDocument();
    expect(systemButton).toBeInTheDocument();

    fireEvent.click(darkButton);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    fireEvent.click(systemButton);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});

describe('TabbedContainer Component', () => {
  it('renders with bottom-docked tabs: Properties, Elements, Alarms, Events', () => {
    const mockTabs = [
      { label: 'Properties', content: <div data-testid="prop-content">Properties Panel</div> },
      { label: 'Elements', content: <div data-testid="elem-content">Elements Panel</div> },
      { label: 'Alarms', content: <div data-testid="alarm-content">Alarms Panel</div> },
      { label: 'Events', content: <div data-testid="event-content">Events Panel</div> },
    ];

    render(<TabbedContainer tabs={mockTabs} />);

    expect(screen.getByTestId('tabbed-container')).toBeInTheDocument();
    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();

    expect(screen.getByTestId('tab-button-properties')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-elements')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-alarms')).toBeInTheDocument();
    expect(screen.getByTestId('tab-button-events')).toBeInTheDocument();

    // Default active tab should be Properties
    expect(screen.getByTestId('prop-content')).toBeInTheDocument();
    expect(screen.queryByTestId('elem-content')).not.toBeInTheDocument();

    // Click Elements tab
    fireEvent.click(screen.getByTestId('tab-button-elements'));
    expect(screen.getByTestId('elem-content')).toBeInTheDocument();
    expect(screen.queryByTestId('prop-content')).not.toBeInTheDocument();
  });
});

describe('TableView Component', () => {
  it('displays Elements table view with correct columns, labels and alarm badge', () => {
    render(<TableView type="elements" />);

    expect(screen.getByTestId('table-elements')).toBeInTheDocument();
    expect(screen.getByText('Object')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Primary State')).toBeInTheDocument();
    expect(screen.getByText('Alarms Summary')).toBeInTheDocument();

    expect(screen.getByText('BTS22')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('BTS11')).toBeInTheDocument();
    expect(screen.getByText('1 M+')).toBeInTheDocument();
    expect(screen.getByText('1 m')).toBeInTheDocument();
    expect(screen.getByText('4 W')).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-bts').length).toBe(2);
    expect(screen.getAllByTestId('icon-bsc').length).toBe(1);
  });

  it('displays Alarms table view with correct columns and severity badges', () => {
    render(<TableView type="alarms" />);

    expect(screen.getByTestId('table-alarms')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();

    expect(screen.getByText('M+')).toBeInTheDocument();
    expect(screen.getByText('m')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText('Alarm 3_ - Antenna degraded')).toBeInTheDocument();
  });

  it('displays Events table view with correct columns', () => {
    render(<TableView type="events" />);

    expect(screen.getByTestId('table-events')).toBeInTheDocument();
    expect(screen.getByText('Event ID')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();

    expect(screen.getByText('EV001')).toBeInTheDocument();
    expect(screen.getByText('EV002')).toBeInTheDocument();
    expect(screen.getByText('Reference Frame config modified')).toBeInTheDocument();
    expect(screen.getByText('Datum set to WGS-84')).toBeInTheDocument();
  });
});

describe('Layout Sidebar Collapse Integration', () => {
  it('should toggle collapsible sidebar when header menu button is clicked', () => {
    vi.mocked(useGeoLocation).mockReturnValue({
      geoLocation: null,
      loading: false,
      error: null,
      saveGeoLocation: vi.fn(),
    });

    render(<Layout />);
    const sidebar = screen.getByTestId('sidebar-nav');
    expect(sidebar.className).not.toContain('collapsed');

    // Toggle collapse
    const toggleButton = screen.getByTestId('menu-toggle-button');
    fireEvent.click(toggleButton);
    expect(sidebar.className).toContain('collapsed');

    // Labels should be hidden
    expect(within(sidebar).queryByText('Geodetic System')).not.toBeInTheDocument();
    expect(within(sidebar).queryByText('Alternate System')).not.toBeInTheDocument();

    // Toggle again
    fireEvent.click(toggleButton);
    expect(sidebar.className).not.toContain('collapsed');
    expect(within(sidebar).getByText('Geodetic System')).toBeInTheDocument();
  });
});
