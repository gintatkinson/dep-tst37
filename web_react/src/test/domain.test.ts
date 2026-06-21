import { describe, it, expect } from 'vitest';
import { validateReferenceFrame, getDefaultReferenceFrame, DomainValidationError } from '../domain/validation';
import type { ReferenceFrame } from '../domain/types';

describe('Domain Models and Validation Rules', () => {
  describe('getDefaultReferenceFrame', () => {
    it('should return a default reference frame with astronomical-body as earth and geodetic-datum as wgs-84', () => {
      const defaultFrame = getDefaultReferenceFrame();
      expect(defaultFrame.astronomicalBody).toBe('earth');
      expect(defaultFrame.geodeticSystem?.geodeticDatum).toBe('wgs-84');
    });
  });

  describe('validateReferenceFrame', () => {
    it('should pass for valid inputs', () => {
      const validFrame: ReferenceFrame = {
        alternateSystem: 'virtual-mars-simulation',
        astronomicalBody: 'mars',
        geodeticSystem: {
          geodeticDatum: 'mola-2000',
          coordAccuracy: 0.0001,
          heightAccuracy: 0.1,
        },
      };

      const result = validateReferenceFrame(validFrame);
      expect(result.astronomicalBody).toBe('mars');
      expect(result.geodeticSystem?.geodeticDatum).toBe('mola-2000');
    });

    it('should reject invalid astronomical-body containing uppercase letters', () => {
      const invalidFrame = {
        astronomicalBody: 'Earth', // uppercase letters
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
        },
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);

      try {
        validateReferenceFrame(invalidFrame);
      } catch (err) {
        const validationErr = err as DomainValidationError;
        expect(validationErr.errors).toBeDefined();
        const bodyError = validationErr.errors.find(e => e.path === '/reference-frame/astronomical-body');
        expect(bodyError).toBeDefined();
        expect(bodyError?.type).toBe('constraint-violation');
      }
    });

    it('should reject invalid geodetic-datum pattern containing uppercase or illegal characters', () => {
      const invalidFrame = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'WGS-84', // uppercase letters
        },
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);

      try {
        validateReferenceFrame(invalidFrame);
      } catch (err) {
        const validationErr = err as DomainValidationError;
        const datumError = validationErr.errors.find(e => e.path === '/reference-frame/geodetic-system/geodetic-datum');
        expect(datumError).toBeDefined();
        expect(datumError?.type).toBe('constraint-violation');
      }
    });

    it('should reject coord-accuracy exceeding 6 decimal places', () => {
      const invalidFrame = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: 0.1234567, // 7 decimal places
        },
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);

      try {
        validateReferenceFrame(invalidFrame);
      } catch (err) {
        const validationErr = err as DomainValidationError;
        const accuracyError = validationErr.errors.find(e => e.path === '/reference-frame/geodetic-system/coord-accuracy');
        expect(accuracyError).toBeDefined();
        expect(accuracyError?.type).toBe('constraint-violation');
      }
    });

    it('should reject height-accuracy exceeding 6 decimal places', () => {
      const invalidFrame = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          heightAccuracy: 0.1234567, // 7 decimal places
        },
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);

      try {
        validateReferenceFrame(invalidFrame);
      } catch (err) {
        const validationErr = err as DomainValidationError;
        const accuracyError = validationErr.errors.find(e => e.path === '/reference-frame/geodetic-system/height-accuracy');
        expect(accuracyError).toBeDefined();
        expect(accuracyError?.type).toBe('constraint-violation');
      }
    });

    it('should replace spaces with dashes in geodetic-datum', () => {
      const frame = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs 84-custom',
        },
      };

      const result = validateReferenceFrame(frame);
      expect(result.geodeticSystem?.geodeticDatum).toBe('wgs-84-custom');
    });
  });
});
