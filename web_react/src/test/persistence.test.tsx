import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MockGeoLocationRepository } from '../persistence/mock-repository';
import { GeoLocationProvider, useGeoLocation } from '../context/GeoLocationContext';
import type { GeoLocation } from '../domain/types';
import { DomainValidationError, getDefaultGeoLocation } from '../domain/validation';

describe('Persistence Layer & Context', () => {
  describe('MockGeoLocationRepository', () => {
    let repo: MockGeoLocationRepository;

    beforeEach(() => {
      repo = new MockGeoLocationRepository();
    });

    it('should initialize with default GeoLocation on load if empty', async () => {
      const location = await repo.load();
      expect(location).toEqual(getDefaultGeoLocation());
      expect(location.referenceFrame?.astronomicalBody).toBe('earth');
      expect(location.referenceFrame?.geodeticSystem?.geodeticDatum).toBe('wgs-84');
      expect(location.location?.ellipsoid?.latitude).toBe(0);
      expect(location.location?.ellipsoid?.longitude).toBe(0);
    });

    it('should save and load a valid GeoLocation with ellipsoid location choice', async () => {
      const validLocation: GeoLocation = {
        referenceFrame: {
          astronomicalBody: 'moon',
          geodeticSystem: {
            geodeticDatum: 'luna-1969',
            coordAccuracy: 0.123456,
            heightAccuracy: 1.123456,
          },
        },
        location: {
          ellipsoid: {
            latitude: 37.774929,
            longitude: -122.419416,
            height: 10.123456,
          },
        },
      };
      await repo.save(validLocation);
      const loaded = await repo.load();
      expect(loaded).toEqual(validLocation);
    });

    it('should save and load a valid GeoLocation with cartesian location choice', async () => {
      const validLocation: GeoLocation = {
        referenceFrame: {
          astronomicalBody: 'earth',
          geodeticSystem: {
            geodeticDatum: 'wgs-84',
          },
        },
        location: {
          cartesian: {
            x: 1000.123456,
            y: 2000.654321,
            z: -3000.789012,
          },
        },
      };
      await repo.save(validLocation);
      const loaded = await repo.load();
      expect(loaded).toEqual(validLocation);
    });

    it('should reject invalid GeoLocations on save and throw DomainValidationError', async () => {
      // Choice exclusive violation: both ellipsoid and cartesian defined
      const invalidBoth: GeoLocation = {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: { latitude: 0, longitude: 0 },
          cartesian: { x: 100.123456, y: 100.123456, z: 100.123456 }
        }
      };
      await expect(repo.save(invalidBoth)).rejects.toThrow(DomainValidationError);

      // Invalid latitude range
      const invalidLatRange: GeoLocation = {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: { latitude: 95.0, longitude: 0 }
        }
      };
      await expect(repo.save(invalidLatRange)).rejects.toThrow(DomainValidationError);

      // Invalid cartesian decimals (must have exactly 6 decimals)
      const invalidDecimals: GeoLocation = {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          cartesian: { x: 100.123, y: 100.123456, z: 100.123456 }
        }
      };
      await expect(repo.save(invalidDecimals)).rejects.toThrow(DomainValidationError);
    });

    it('should prevent reference-sharing mutations via deep copy', async () => {
      const location: GeoLocation = {
        referenceFrame: {
          astronomicalBody: 'moon',
          geodeticSystem: {
            geodeticDatum: 'luna-1969',
            coordAccuracy: 0.123456,
            heightAccuracy: 1.123456,
          },
        },
        location: {
          ellipsoid: {
            latitude: 37.774929,
            longitude: -122.419416,
            height: 10.123456,
          },
        },
      };
      await repo.save(location);
      const loaded1 = await repo.load();
      
      // Mutate loaded1 geodeticSystem & ellipsoid coordinates
      if (loaded1.referenceFrame?.geodeticSystem) {
        loaded1.referenceFrame.geodeticSystem.geodeticDatum = 'mutated';
      }
      if (loaded1.location?.ellipsoid) {
        loaded1.location.ellipsoid.latitude = 0;
      }

      const loaded2 = await repo.load();
      expect(loaded2.referenceFrame?.geodeticSystem?.geodeticDatum).toBe('luna-1969');
      expect(loaded2.location?.ellipsoid?.latitude).toBe(37.774929);
    });
  });

  describe('GeoLocationProvider and useGeoLocation hook', () => {
    const TestComponent = () => {
      const { geoLocation, loading, error, saveGeoLocation } = useGeoLocation();

      if (loading) return <div data-testid="loading">Loading...</div>;
      if (error) return <div data-testid="error">{error.message}</div>;
      if (!geoLocation) return <div data-testid="no-location">No Location</div>;

      const latitude = geoLocation.location?.ellipsoid?.latitude;
      const longitude = geoLocation.location?.ellipsoid?.longitude;

      return (
        <div>
          <div data-testid="body">{geoLocation.referenceFrame?.astronomicalBody}</div>
          <div data-testid="datum">{geoLocation.referenceFrame?.geodeticSystem?.geodeticDatum}</div>
          <div data-testid="latitude">{latitude}</div>
          <div data-testid="longitude">{longitude}</div>
          <button
            data-testid="save-btn"
            onClick={() =>
              saveGeoLocation({
                referenceFrame: {
                  astronomicalBody: 'mars',
                  geodeticSystem: { geodeticDatum: 'mola-2000' },
                },
                location: {
                  ellipsoid: {
                    latitude: 10.123456,
                    longitude: 20.123456,
                  },
                },
              })
            }
          >
            Save Mars
          </button>
          <button
            data-testid="save-invalid-btn"
            onClick={() =>
              saveGeoLocation({
                referenceFrame: {
                  astronomicalBody: 'mars\u0001', // Invalid control char
                  geodeticSystem: { geodeticDatum: 'mola-2000' },
                },
                location: {
                  ellipsoid: {
                    latitude: 10.123456,
                    longitude: 20.123456,
                  },
                },
              })
            }
          >
            Save Invalid
          </button>
        </div>
      );
    };

    it('should verify loading state and fetching default values', async () => {
      const repo = new MockGeoLocationRepository();
      render(
        <GeoLocationProvider repository={repo}>
          <TestComponent />
        </GeoLocationProvider>
      );

      // Loading state should be active initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait until loaded
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('body')).toHaveTextContent('earth');
      expect(screen.getByTestId('datum')).toHaveTextContent('wgs-84');
      expect(screen.getByTestId('latitude')).toHaveTextContent('0');
      expect(screen.getByTestId('longitude')).toHaveTextContent('0');
    });

    it('should save a valid geoLocation and update state', async () => {
      const repo = new MockGeoLocationRepository();
      render(
        <GeoLocationProvider repository={repo}>
          <TestComponent />
        </GeoLocationProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const btn = screen.getByTestId('save-btn');
      await act(async () => {
        btn.click();
      });

      expect(screen.getByTestId('body')).toHaveTextContent('mars');
      expect(screen.getByTestId('datum')).toHaveTextContent('mola-2000');
      expect(screen.getByTestId('latitude')).toHaveTextContent('10.123456');
      expect(screen.getByTestId('longitude')).toHaveTextContent('20.123456');

      // Check repository also got updated
      const loaded = await repo.load();
      expect(loaded.referenceFrame?.astronomicalBody).toBe('mars');
      expect(loaded.location?.ellipsoid?.latitude).toBe(10.123456);
    });

    it('should handle invalid geoLocations and propagate the validation error', async () => {
      const repo = new MockGeoLocationRepository();
      render(
        <GeoLocationProvider repository={repo}>
          <TestComponent />
        </GeoLocationProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const invalidBtn = screen.getByTestId('save-invalid-btn');
      await act(async () => {
        invalidBtn.click();
      });

      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error').textContent).toContain('Validation failed');
    });
  });
});
