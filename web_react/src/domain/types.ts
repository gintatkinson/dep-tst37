export interface GeodeticSystem {
  geodeticDatum: string;
  coordAccuracy?: number;
  heightAccuracy?: number;
}

export interface ReferenceFrame {
  alternateSystem?: string;
  astronomicalBody: string;
  geodeticSystem?: GeodeticSystem;
}

/**
 * Represents geographic coordinates in an ellipsoidal system.
 * @realizes UML:EllipsoidLocation
 */
export interface EllipsoidLocation {
  /**
   * Latitude in degrees, range [-90..90]. Must have exactly 16 decimal places.
   */
  latitude: number;
  /**
   * Longitude in degrees, range [-180..180]. Must have exactly 16 decimal places.
   */
  longitude: number;
  /**
   * Optional height. Must have exactly 6 decimal places if defined.
   */
  height?: number;
}

/**
 * Represents 3D Cartesian coordinates.
 * @realizes UML:CartesianLocation
 */
export interface CartesianLocation {
  /**
   * X coordinate in meters. Must have exactly 6 decimal places.
   */
  x: number;
  /**
   * Y coordinate in meters. Must have exactly 6 decimal places.
   */
  y: number;
  /**
   * Z coordinate in meters. Must have exactly 6 decimal places.
   */
  z: number;
}

/**
 * Choice between ellipsoid and cartesian representation.
 * Exactly one must be defined.
 * @realizes UML:LocationChoice
 */
export interface LocationChoice {
  ellipsoid?: EllipsoidLocation;
  cartesian?: CartesianLocation;
}

/**
 * Complete Geographic Position containing an optional reference frame and location choice.
 * @realizes UML:GeoLocation
 */
export interface GeoLocation {
  referenceFrame?: ReferenceFrame;
  location?: LocationChoice;
}
