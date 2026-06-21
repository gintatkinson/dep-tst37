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
          coordAccuracy: 0.123456,
          heightAccuracy: 0.654321,
        },
      };

      const result = validateReferenceFrame(validFrame);
      expect(result.astronomicalBody).toBe('mars');
      expect(result.geodeticSystem?.geodeticDatum).toBe('mola-2000');
    });

    it('should convert astronomical-body and geodetic-datum to lowercase', () => {
      const frame = {
        astronomicalBody: 'Earth',
        geodeticSystem: {
          geodeticDatum: 'WGS 84',
        },
      };

      const result = validateReferenceFrame(frame);
      expect(result.astronomicalBody).toBe('earth');
      expect(result.geodeticSystem?.geodeticDatum).toBe('wgs-84');
    });

    it('should reject astronomical-body containing illegal control characters', () => {
      const invalidFrame = {
        astronomicalBody: 'earth\u0001',
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);
    });

    it('should reject geodetic-datum containing illegal control characters', () => {
      const invalidFrame = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs\u000184',
        },
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);
    });

    it('should reject coord-accuracy not having exactly 6 decimal places', () => {
      const invalidFrame1 = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: 0.12345, // 5 decimals
        },
      };
      const invalidFrame2 = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: 0.1234567, // 7 decimals
        },
      };

      expect(() => validateReferenceFrame(invalidFrame1)).toThrow(DomainValidationError);
      expect(() => validateReferenceFrame(invalidFrame2)).toThrow(DomainValidationError);
    });

    it('should reject height-accuracy not having exactly 6 decimal places', () => {
      const invalidFrame1 = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          heightAccuracy: 0.12345, // 5 decimals
        },
      };
      const invalidFrame2 = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          heightAccuracy: 0.1234567, // 7 decimals
        },
      };

      expect(() => validateReferenceFrame(invalidFrame1)).toThrow(DomainValidationError);
      expect(() => validateReferenceFrame(invalidFrame2)).toThrow(DomainValidationError);
    });

    it('should reject negative coord-accuracy or height-accuracy', () => {
      const invalidFrame1 = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          coordAccuracy: -0.123456,
        },
      };
      const invalidFrame2 = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'wgs-84',
          heightAccuracy: -0.123456,
        },
      };

      expect(() => validateReferenceFrame(invalidFrame1)).toThrow(DomainValidationError);
      expect(() => validateReferenceFrame(invalidFrame2)).toThrow(DomainValidationError);
    });

    it('should default geodetic-datum to wgs-84 on Earth when no datum is specified, even if geodeticSystem is omitted', () => {
      const frameWithoutSystem = {
        astronomicalBody: 'earth',
      };
      const result = validateReferenceFrame(frameWithoutSystem);
      expect(result.geodeticSystem?.geodeticDatum).toBe('wgs-84');

      const frameWithEmptySystem = {
        astronomicalBody: 'earth',
        geodeticSystem: {},
      };
      const result2 = validateReferenceFrame(frameWithEmptySystem);
      expect(result2.geodeticSystem?.geodeticDatum).toBe('wgs-84');
    });

    it('should reject empty string geodetic-datum on non-Earth bodies', () => {
      const invalidFrame = {
        astronomicalBody: 'mars',
        geodeticSystem: {
          geodeticDatum: '',
        },
      };

      expect(() => validateReferenceFrame(invalidFrame)).toThrow(DomainValidationError);
    });

    it('should replace spaces with dashes and convert to lowercase in geodetic-datum', () => {
      const frame = {
        astronomicalBody: 'earth',
        geodeticSystem: {
          geodeticDatum: 'WGS 84-custom',
        },
      };

      const result = validateReferenceFrame(frame);
      expect(result.geodeticSystem?.geodeticDatum).toBe('wgs-84-custom');
    });
  });
});
