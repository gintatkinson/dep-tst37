import { describe, it, expect } from 'vitest';
import {
  validateReferenceFrame,
  getDefaultReferenceFrame,
  DomainValidationError,
  validateGeoLocation,
  getDefaultGeoLocation,
} from '../domain/validation';
import type { ReferenceFrame, GeoLocation } from '../domain/types';

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

  describe('getDefaultGeoLocation', () => {
    it('should return a default GeoLocation with earth reference frame and coordinates at 0', () => {
      const defaultGeo = getDefaultGeoLocation();
      expect(defaultGeo.referenceFrame).toBeDefined();
      expect(defaultGeo.referenceFrame?.astronomicalBody).toBe('earth');
      expect(defaultGeo.location?.ellipsoid?.latitude).toBe(0);
      expect(defaultGeo.location?.ellipsoid?.longitude).toBe(0);
    });
  });

  describe('validateGeoLocation', () => {
    it('should pass for a valid ellipsoid location choice with 16 decimal precision', () => {
      const valid: GeoLocation = {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: {
            latitude: 37.774929,
            longitude: -122.419416,
            height: 10.123456,
          },
        },
      };
      const validStringInput = {
        referenceFrame: { astronomicalBody: 'earth' },
        location: {
          ellipsoid: {
            latitude: "37.7749290000000000",
            longitude: "-122.4194160000000000",
            height: "10.123456",
          },
        },
      };
      const result1 = validateGeoLocation(valid);
      expect(result1.location?.ellipsoid?.latitude).toBe(37.774929);
      expect(result1.location?.ellipsoid?.longitude).toBe(-122.419416);
      expect(result1.location?.ellipsoid?.height).toBe(10.123456);

      const result2 = validateGeoLocation(validStringInput);
      expect(result2.location?.ellipsoid?.latitude).toBe(37.774929);
      expect(result2.location?.ellipsoid?.longitude).toBe(-122.419416);
      expect(result2.location?.ellipsoid?.height).toBe(10.123456);
    });

    it('should pass for a valid cartesian location choice with 6 decimal precision', () => {
      const valid = {
        location: {
          cartesian: {
            x: "1234567.123456",
            y: "-7654321.654321",
            z: "0.123456",
          },
        },
      };
      const result = validateGeoLocation(valid);
      expect(result.location?.cartesian?.x).toBe(1234567.123456);
      expect(result.location?.cartesian?.y).toBe(-7654321.654321);
      expect(result.location?.cartesian?.z).toBe(0.123456);
    });

    it('should reject if both ellipsoid and cartesian are defined', () => {
      const invalid = {
        location: {
          ellipsoid: {
            latitude: "37.7749290000000000",
            longitude: "-122.4194160000000000",
          },
          cartesian: {
            x: "1234567.123456",
            y: "-7654321.654321",
            z: "0.123456",
          },
        },
      };
      expect(() => validateGeoLocation(invalid)).toThrow(DomainValidationError);
      try {
        validateGeoLocation(invalid);
      } catch (err: unknown) {
        const error = err as DomainValidationError;
        expect(error.errors[0].path).toBe('/location');
        expect(error.errors[0].message).toContain('Exactly one');
      }
    });

    it('should reject if neither ellipsoid nor cartesian is defined', () => {
      const invalidEmpty = {
        location: {},
      };
      const invalidMissing = {};

      expect(() => validateGeoLocation(invalidEmpty)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(invalidMissing)).toThrow(DomainValidationError);

      try {
        validateGeoLocation(invalidEmpty);
      } catch (err: unknown) {
        const error = err as DomainValidationError;
        expect(error.errors[0].path).toBe('/location');
      }
    });

    it('should reject if latitude or longitude are out of range', () => {
      const latTooHigh = {
        location: {
          ellipsoid: {
            latitude: "90.0000010000000000",
            longitude: "0.0000000000000000",
          },
        },
      };
      const latTooLow = {
        location: {
          ellipsoid: {
            latitude: "-90.0000010000000000",
            longitude: "0.0000000000000000",
          },
        },
      };
      const lonTooHigh = {
        location: {
          ellipsoid: {
            latitude: "0.0000000000000000",
            longitude: "180.0000010000000000",
          },
        },
      };
      const lonTooLow = {
        location: {
          ellipsoid: {
            latitude: "0.0000000000000000",
            longitude: "-180.0000010000000000",
          },
        },
      };

      expect(() => validateGeoLocation(latTooHigh)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(latTooLow)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(lonTooHigh)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(lonTooLow)).toThrow(DomainValidationError);
    });

    it('should reject if latitude or longitude do not have exactly 16 decimal places', () => {
      const latWrongDecimals = {
        location: {
          ellipsoid: {
            latitude: "37.774929000000000",
            longitude: "-122.4194160000000000",
          },
        },
      };
      const lonWrongDecimals = {
        location: {
          ellipsoid: {
            latitude: "37.7749290000000000",
            longitude: "-122.41941600000000000",
          },
        },
      };

      expect(() => validateGeoLocation(latWrongDecimals)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(lonWrongDecimals)).toThrow(DomainValidationError);
    });

    it('should reject if height does not have exactly 6 decimal places', () => {
      const heightWrongDecimals = {
        location: {
          ellipsoid: {
            latitude: "37.7749290000000000",
            longitude: "-122.4194160000000000",
            height: "10.12345",
          },
        },
      };
      expect(() => validateGeoLocation(heightWrongDecimals)).toThrow(DomainValidationError);
    });

    it('should reject if x, y, or z do not have exactly 6 decimal places', () => {
      const xWrong = {
        location: {
          cartesian: {
            x: "100.12345",
            y: "200.123456",
            z: "300.123456",
          },
        },
      };
      const yWrong = {
        location: {
          cartesian: {
            x: "100.123456",
            y: "200.1234567",
            z: "300.123456",
          },
        },
      };
      const zWrong = {
        location: {
          cartesian: {
            x: "100.123456",
            y: "200.123456",
            z: "300.12",
          },
        },
      };

      expect(() => validateGeoLocation(xWrong)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(yWrong)).toThrow(DomainValidationError);
      expect(() => validateGeoLocation(zWrong)).toThrow(DomainValidationError);
    });
  });
});
