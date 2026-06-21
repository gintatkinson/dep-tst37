import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MockGeoLocationRepository } from '../persistence/mock-repository';
import { GeoLocationProvider, useGeoLocation } from '../context/GeoLocationContext';
import type { ReferenceFrame } from '../domain/types';
import { DomainValidationError } from '../domain/validation';

describe('Persistence Layer & Context', () => {
  describe('MockGeoLocationRepository', () => {
    let repo: MockGeoLocationRepository;

    beforeEach(() => {
      repo = new MockGeoLocationRepository();
    });

    it('should initialize with default reference frame on load if empty', async () => {
      const frame = await repo.load();
      expect(frame.astronomicalBody).toBe('earth');
      expect(frame.geodeticSystem?.geodeticDatum).toBe('wgs-84');
    });

    it('should save and load a valid reference frame', async () => {
      const validFrame: ReferenceFrame = {
        astronomicalBody: 'moon',
        geodeticSystem: {
          geodeticDatum: 'luna-1969',
          coordAccuracy: 0.123456,
          heightAccuracy: 1.123456,
        },
      };
      await repo.save(validFrame);
      const loaded = await repo.load();
      expect(loaded).toEqual(validFrame);
    });

    it('should reject invalid frames on save and throw DomainValidationError', async () => {
      const invalidFrame = {
        astronomicalBody: 'earth\u0001', // illegal control character
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
        },
      };
      await expect(repo.save(invalidFrame as unknown as ReferenceFrame)).rejects.toThrow(DomainValidationError);
    });

    it('should prevent reference-sharing mutations via deep copy', async () => {
      const frame: ReferenceFrame = {
        astronomicalBody: 'moon',
        geodeticSystem: {
          geodeticDatum: 'luna-1969',
          coordAccuracy: 0.123456,
          heightAccuracy: 1.123456,
        },
      };
      await repo.save(frame);
      const loaded1 = await repo.load();
      
      // Mutate loaded1 geodeticSystem
      if (loaded1.geodeticSystem) {
        loaded1.geodeticSystem.geodeticDatum = 'mutated';
      }

      const loaded2 = await repo.load();
      expect(loaded2.geodeticSystem?.geodeticDatum).toBe('luna-1969');
    });
  });

  describe('GeoLocationProvider and useGeoLocation hook', () => {
    const TestComponent = () => {
      const { referenceFrame, loading, error, saveFrame } = useGeoLocation();

      if (loading) return <div data-testid="loading">Loading...</div>;
      if (error) return <div data-testid="error">{error.message}</div>;
      if (!referenceFrame) return <div data-testid="no-frame">No Frame</div>;

      return (
        <div>
          <div data-testid="body">{referenceFrame.astronomicalBody}</div>
          <div data-testid="datum">{referenceFrame.geodeticSystem?.geodeticDatum}</div>
          <button
            data-testid="save-btn"
            onClick={() =>
              saveFrame({
                astronomicalBody: 'mars',
                geodeticSystem: { geodeticDatum: 'mola-2000' },
              })
            }
          >
            Save Mars
          </button>
          <button
            data-testid="save-invalid-btn"
            onClick={() =>
              saveFrame({
                astronomicalBody: 'mars\u0001', // Invalid control char
                geodeticSystem: { geodeticDatum: 'mola-2000' },
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
    });

    it('should save a valid frame and update state', async () => {
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

      // Check repository also got updated
      const loaded = await repo.load();
      expect(loaded.astronomicalBody).toBe('mars');
    });

    it('should handle invalid frames and propagate the validation error', async () => {
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
