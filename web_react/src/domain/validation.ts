import type { ReferenceFrame, GeodeticSystem } from './types';

export interface ValidationError {
  type: 'constraint-violation';
  path: string;
  message: string;
}

export class DomainValidationError extends Error {
  public errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(`Validation failed: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    this.name = 'DomainValidationError';
    this.errors = errors;
  }
}

/**
 * Counts the number of decimal places of a given value.
 * Handles both number and string representations.
 */
function countDecimals(value: unknown): number {
  if (value === undefined || value === null) return 0;
  const str = String(value).trim();
  const num = Number(str);
  if (isNaN(num)) return 0;
  if (Math.floor(num) === num) return 0;

  if (str.toLowerCase().includes('e')) {
    const parts = str.toLowerCase().split('e');
    const decimals = (parts[0].split('.')[1] || '').length;
    const exponent = parseInt(parts[1], 10);
    return Math.max(0, decimals - exponent);
  }

  const parts = str.split('.');
  return parts.length > 1 ? parts[1].length : 0;
}

/**
 * Get the default reference frame config.
 */
export function getDefaultReferenceFrame(): ReferenceFrame {
  return {
    astronomicalBody: 'earth',
    geodeticSystem: {
      geodeticDatum: 'wgs-84',
    },
  };
}

/**
 * Validates reference-frame configuration and returns a normalized ReferenceFrame object.
 * Throws a DomainValidationError if validation fails.
 */
export function validateReferenceFrame(input: unknown): ReferenceFrame {
  const errors: ValidationError[] = [];

  const obj = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};

  // Parse and normalize astronomical body
  const rawAstronomicalBody = obj.astronomicalBody ?? obj['astronomical-body'];
  const astronomicalBody = rawAstronomicalBody === undefined || rawAstronomicalBody === null || rawAstronomicalBody === ''
    ? 'earth'
    : String(rawAstronomicalBody).toLowerCase();

  // Pattern: [ -@\[-\^_-~]* (excludes uppercase letters [A-Z] and control chars)
  const pattern = /^[\x20-\x40\x5b-\x7e]*$/;

  if (!pattern.test(astronomicalBody)) {
    errors.push({
      type: 'constraint-violation',
      path: '/reference-frame/astronomical-body',
      message: 'astronomical-body contains invalid characters. Uppercase letters and control characters are not allowed.',
    });
  }

  // Parse and normalize geodetic system
  const rawGeodeticSystem = obj.geodeticSystem ?? obj['geodetic-system'];
  let geodeticSystemResult: GeodeticSystem | undefined;

  const isEarth = astronomicalBody === 'earth';
  const hasGeodeticSystem = rawGeodeticSystem !== undefined && rawGeodeticSystem !== null;

  let geodeticDatumStr: string | undefined;
  let coordAccuracy: unknown;
  let heightAccuracy: unknown;

  if (hasGeodeticSystem && typeof rawGeodeticSystem === 'object') {
    const geoObj = rawGeodeticSystem as Record<string, unknown>;
    const rawDatum = geoObj.geodeticDatum ?? geoObj['geodetic-datum'];
    coordAccuracy = geoObj.coordAccuracy ?? geoObj['coord-accuracy'];
    heightAccuracy = geoObj.heightAccuracy ?? geoObj['height-accuracy'];

    if (rawDatum !== undefined && rawDatum !== null) {
      geodeticDatumStr = String(rawDatum).replace(/ /g, '-').toLowerCase();
    }
  }

  // Handle defaulting of geodeticDatum and empty string checks
  if (geodeticDatumStr === undefined || geodeticDatumStr === null) {
    if (isEarth) {
      geodeticDatumStr = 'wgs-84';
    } else {
      geodeticDatumStr = '';
      if (hasGeodeticSystem) {
        errors.push({
          type: 'constraint-violation',
          path: '/reference-frame/geodetic-system/geodetic-datum',
          message: 'geodetic-datum is mandatory when geodetic-system is configured.',
        });
      }
    }
  } else if (geodeticDatumStr === '') {
    if (!isEarth) {
      errors.push({
        type: 'constraint-violation',
        path: '/reference-frame/geodetic-system/geodetic-datum',
        message: 'geodetic-datum cannot be empty for non-earth bodies.',
      });
    } else {
      geodeticDatumStr = 'wgs-84';
    }
  }

  if (geodeticDatumStr !== '' && !pattern.test(geodeticDatumStr)) {
    errors.push({
      type: 'constraint-violation',
      path: '/reference-frame/geodetic-system/geodetic-datum',
      message: 'geodetic-datum contains invalid characters. Uppercase letters and control characters are not allowed.',
    });
  }

  // Construct geodeticSystemResult if we have geodetic system fields or if it's Earth
  if (geodeticDatumStr !== '' || coordAccuracy !== undefined || heightAccuracy !== undefined || isEarth) {
    const datum = geodeticDatumStr || (isEarth ? 'wgs-84' : '');

    if (coordAccuracy !== undefined && coordAccuracy !== null) {
      const numVal = Number(coordAccuracy);
      if (isNaN(numVal)) {
        errors.push({
          type: 'constraint-violation',
          path: '/reference-frame/geodetic-system/coord-accuracy',
          message: 'coord-accuracy must be a number.',
        });
      } else {
        if (countDecimals(coordAccuracy) !== 6) {
          errors.push({
            type: 'constraint-violation',
            path: '/reference-frame/geodetic-system/coord-accuracy',
            message: 'coord-accuracy fraction digits must be exactly 6.',
          });
        }
        if (numVal < 0) {
          errors.push({
            type: 'constraint-violation',
            path: '/reference-frame/geodetic-system/coord-accuracy',
            message: 'coord-accuracy must be non-negative.',
          });
        }
      }
    }

    if (heightAccuracy !== undefined && heightAccuracy !== null) {
      const numVal = Number(heightAccuracy);
      if (isNaN(numVal)) {
        errors.push({
          type: 'constraint-violation',
          path: '/reference-frame/geodetic-system/height-accuracy',
          message: 'height-accuracy must be a number.',
        });
      } else {
        if (countDecimals(heightAccuracy) !== 6) {
          errors.push({
            type: 'constraint-violation',
            path: '/reference-frame/geodetic-system/height-accuracy',
            message: 'height-accuracy fraction digits must be exactly 6.',
          });
        }
        if (numVal < 0) {
          errors.push({
            type: 'constraint-violation',
            path: '/reference-frame/geodetic-system/height-accuracy',
            message: 'height-accuracy must be non-negative.',
          });
        }
      }
    }

    geodeticSystemResult = {
      geodeticDatum: datum,
      ...(coordAccuracy !== undefined && coordAccuracy !== null && !isNaN(Number(coordAccuracy)) ? { coordAccuracy: Number(coordAccuracy) } : {}),
      ...(heightAccuracy !== undefined && heightAccuracy !== null && !isNaN(Number(heightAccuracy)) ? { heightAccuracy: Number(heightAccuracy) } : {}),
    };
  }

  if (errors.length > 0) {
    throw new DomainValidationError(errors);
  }

  const alternateSystem = obj.alternateSystem ?? obj['alternate-system'];

  return {
    ...(alternateSystem !== undefined && alternateSystem !== null ? { alternateSystem: String(alternateSystem) } : {}),
    astronomicalBody,
    ...(geodeticSystemResult ? { geodeticSystem: geodeticSystemResult } : {}),
  };
}
