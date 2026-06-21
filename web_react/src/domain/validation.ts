import type { ReferenceFrame, GeodeticSystem, GeoLocation, LocationChoice } from './types';

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

/**
 * Validates a GeoLocation object and returns a normalized GeoLocation.
 * Throws a DomainValidationError if validation fails.
 */
export function validateGeoLocation(input: unknown): GeoLocation {
  const errors: ValidationError[] = [];

  const obj = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};

  // 1. Validate Reference Frame if present
  let referenceFrame: ReferenceFrame | undefined;
  const rawReferenceFrame = obj.referenceFrame ?? obj['reference-frame'];
  if (rawReferenceFrame !== undefined && rawReferenceFrame !== null) {
    try {
      referenceFrame = validateReferenceFrame(rawReferenceFrame);
    } catch (err) {
      if (err instanceof DomainValidationError) {
        errors.push(...err.errors);
      } else {
        throw err;
      }
    }
  }

  // 2. Validate Location Choice Exclusivity
  const rawLocation = obj.location;
  const locObj = typeof rawLocation === 'object' && rawLocation !== null ? (rawLocation as Record<string, unknown>) : null;

  const ellipsoid = locObj?.ellipsoid;
  const cartesian = locObj?.cartesian;

  const hasEllipsoid = ellipsoid !== undefined && ellipsoid !== null;
  const hasCartesian = cartesian !== undefined && cartesian !== null;

  let locationResult: LocationChoice | undefined;

  if ((hasEllipsoid && hasCartesian) || (!hasEllipsoid && !hasCartesian)) {
    errors.push({
      type: 'constraint-violation',
      path: '/location',
      message: 'Exactly one of ellipsoid or cartesian must be defined.',
    });
  } else {
    // Exactly one is defined
    if (hasEllipsoid) {
      const ellObj = typeof ellipsoid === 'object' && ellipsoid !== null ? (ellipsoid as Record<string, unknown>) : {};

      const latVal = ellObj.latitude;
      const lonVal = ellObj.longitude;
      const heightVal = ellObj.height;

      let latitude: number | undefined;
      let longitude: number | undefined;
      let height: number | undefined;

      // Validate latitude
      if (latVal === undefined || latVal === null) {
        errors.push({
          type: 'constraint-violation',
          path: '/location/ellipsoid/latitude',
          message: 'latitude is mandatory for ellipsoid location.',
        });
      } else {
        const numLat = Number(latVal);
        if (isNaN(numLat)) {
          errors.push({
            type: 'constraint-violation',
            path: '/location/ellipsoid/latitude',
            message: 'latitude must be a number.',
          });
        } else {
          // Check range [-90..90]
          if (numLat < -90 || numLat > 90) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/ellipsoid/latitude',
              message: 'latitude must be in range [-90..90].',
            });
          }
          // Check precision (16 decimals)
          const decimals = countDecimals(latVal);
          const isValidPrecision = typeof latVal === 'number' ? (decimals <= 16) : (decimals === 16);
          if (!isValidPrecision) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/ellipsoid/latitude',
              message: 'latitude fraction digits must be exactly 16.',
            });
          }
          latitude = numLat;
        }
      }

      // Validate longitude
      if (lonVal === undefined || lonVal === null) {
        errors.push({
          type: 'constraint-violation',
          path: '/location/ellipsoid/longitude',
          message: 'longitude is mandatory for ellipsoid location.',
        });
      } else {
        const numLon = Number(lonVal);
        if (isNaN(numLon)) {
          errors.push({
            type: 'constraint-violation',
            path: '/location/ellipsoid/longitude',
            message: 'longitude must be a number.',
          });
        } else {
          // Check range [-180..180]
          if (numLon < -180 || numLon > 180) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/ellipsoid/longitude',
              message: 'longitude must be in range [-180..180].',
            });
          }
          // Check precision (16 decimals)
          const decimals = countDecimals(lonVal);
          const isValidPrecision = typeof lonVal === 'number' ? (decimals <= 16) : (decimals === 16);
          if (!isValidPrecision) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/ellipsoid/longitude',
              message: 'longitude fraction digits must be exactly 16.',
            });
          }
          longitude = numLon;
        }
      }

      // Validate height if defined
      if (heightVal !== undefined && heightVal !== null) {
        const numHeight = Number(heightVal);
        if (isNaN(numHeight)) {
          errors.push({
            type: 'constraint-violation',
            path: '/location/ellipsoid/height',
            message: 'height must be a number.',
          });
        } else {
          // Check precision (6 decimals)
          const decimals = countDecimals(heightVal);
          if (decimals !== 6) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/ellipsoid/height',
              message: 'height fraction digits must be exactly 6.',
            });
          }
          height = numHeight;
        }
      }

      if (latitude !== undefined && longitude !== undefined) {
        locationResult = {
          ellipsoid: {
            latitude,
            longitude,
            ...(height !== undefined ? { height } : {}),
          },
        };
      }
    } else {
      // Cartesian location choice
      const cartObj = typeof cartesian === 'object' && cartesian !== null ? (cartesian as Record<string, unknown>) : {};

      const xVal = cartObj.x;
      const yVal = cartObj.y;
      const zVal = cartObj.z;

      let x: number | undefined;
      let y: number | undefined;
      let z: number | undefined;

      // Validate x
      if (xVal === undefined || xVal === null) {
        errors.push({
          type: 'constraint-violation',
          path: '/location/cartesian/x',
          message: 'x is mandatory for cartesian location.',
        });
      } else {
        const numX = Number(xVal);
        if (isNaN(numX)) {
          errors.push({
            type: 'constraint-violation',
            path: '/location/cartesian/x',
            message: 'x must be a number.',
          });
        } else {
          const decimals = countDecimals(xVal);
          if (decimals !== 6) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/cartesian/x',
              message: 'x fraction digits must be exactly 6.',
            });
          }
          x = numX;
        }
      }

      // Validate y
      if (yVal === undefined || yVal === null) {
        errors.push({
          type: 'constraint-violation',
          path: '/location/cartesian/y',
          message: 'y is mandatory for cartesian location.',
        });
      } else {
        const numY = Number(yVal);
        if (isNaN(numY)) {
          errors.push({
            type: 'constraint-violation',
            path: '/location/cartesian/y',
            message: 'y must be a number.',
          });
        } else {
          const decimals = countDecimals(yVal);
          if (decimals !== 6) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/cartesian/y',
              message: 'y fraction digits must be exactly 6.',
            });
          }
          y = numY;
        }
      }

      // Validate z
      if (zVal === undefined || zVal === null) {
        errors.push({
          type: 'constraint-violation',
          path: '/location/cartesian/z',
          message: 'z is mandatory for cartesian location.',
        });
      } else {
        const numZ = Number(zVal);
        if (isNaN(numZ)) {
          errors.push({
            type: 'constraint-violation',
            path: '/location/cartesian/z',
            message: 'z must be a number.',
          });
        } else {
          const decimals = countDecimals(zVal);
          if (decimals !== 6) {
            errors.push({
              type: 'constraint-violation',
              path: '/location/cartesian/z',
              message: 'z fraction digits must be exactly 6.',
            });
          }
          z = numZ;
        }
      }

      if (x !== undefined && y !== undefined && z !== undefined) {
        locationResult = {
          cartesian: { x, y, z },
        };
      }
    }
  }

  if (errors.length > 0) {
    throw new DomainValidationError(errors);
  }

  return {
    ...(referenceFrame ? { referenceFrame } : {}),
    location: locationResult,
  };
}

/**
 * Gets a default GeoLocation object.
 */
export function getDefaultGeoLocation(): GeoLocation {
  return {
    referenceFrame: getDefaultReferenceFrame(),
    location: {
      ellipsoid: {
        latitude: 0,
        longitude: 0,
      },
    },
  };
}

