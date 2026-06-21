import React, { useState } from 'react';
import { useGeoLocation } from '../context/GeoLocationContext';
import type { ReferenceFrame, GeodeticSystem, LocationChoice, GeoLocation } from '../domain/types';
import { DomainValidationError } from '../domain/validation';
import type { ValidationError } from '../domain/validation';
import styles from './property-grid.module.css';

interface PropertyGridProps {
  activeView?: 'geodetic' | 'alternate' | 'all';
}

/**
 * PropertyGrid Component.
 * Form-based management of GeoLocation parameters including Reference Frame details,
 * Coordinate Type selection, and specific coordinate fields (Ellipsoid or Cartesian) with high precision.
 *
 * @realizes UML:PropertyGrid
 * @returns {React.ReactElement} The rendered React property grid form.
 */
export const PropertyGrid: React.FC<PropertyGridProps> = ({ activeView = 'all' }) => {
  const { geoLocation, loading, error, saveGeoLocation } = useGeoLocation();

  const [prevGeoLocation, setPrevGeoLocation] = useState<GeoLocation | null>(null);
  const [coordType, setCoordType] = useState<'ellipsoid' | 'cartesian' | ''>('');
  const [formState, setFormState] = useState({
    astronomicalBody: '',
    alternateSystem: '',
    geodeticDatum: '',
    coordAccuracy: '',
    heightAccuracy: '',
    latitude: '',
    longitude: '',
    height: '',
    x: '',
    y: '',
    z: '',
  });

  // Keep state synchronized with context data
  if (geoLocation !== prevGeoLocation) {
    setPrevGeoLocation(geoLocation);
    
    let initialType: 'ellipsoid' | 'cartesian' | '' = '';
    let initialLat = '';
    let initialLon = '';
    let initialHeight = '';
    let initialX = '';
    let initialY = '';
    let initialZ = '';

    if (geoLocation?.location?.ellipsoid) {
      initialType = 'ellipsoid';
      initialLat = geoLocation.location.ellipsoid.latitude !== undefined ? String(geoLocation.location.ellipsoid.latitude) : '';
      initialLon = geoLocation.location.ellipsoid.longitude !== undefined ? String(geoLocation.location.ellipsoid.longitude) : '';
      initialHeight = geoLocation.location.ellipsoid.height !== undefined ? String(geoLocation.location.ellipsoid.height) : '';
    } else if (geoLocation?.location?.cartesian) {
      initialType = 'cartesian';
      initialX = geoLocation.location.cartesian.x !== undefined ? String(geoLocation.location.cartesian.x) : '';
      initialY = geoLocation.location.cartesian.y !== undefined ? String(geoLocation.location.cartesian.y) : '';
      initialZ = geoLocation.location.cartesian.z !== undefined ? String(geoLocation.location.cartesian.z) : '';
    }

    setCoordType(initialType);
    setFormState({
      astronomicalBody: geoLocation?.referenceFrame?.astronomicalBody || '',
      alternateSystem: geoLocation?.referenceFrame?.alternateSystem || '',
      geodeticDatum: geoLocation?.referenceFrame?.geodeticSystem?.geodeticDatum || '',
      coordAccuracy: geoLocation?.referenceFrame?.geodeticSystem?.coordAccuracy !== undefined ? String(geoLocation.referenceFrame.geodeticSystem.coordAccuracy) : '',
      heightAccuracy: geoLocation?.referenceFrame?.geodeticSystem?.heightAccuracy !== undefined ? String(geoLocation.referenceFrame.geodeticSystem.heightAccuracy) : '',
      latitude: initialLat,
      longitude: initialLon,
      height: initialHeight,
      x: initialX,
      y: initialY,
      z: initialZ,
    });
  }

  if (loading) {
    return <div data-testid="loading-state">Loading...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCoordTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as 'ellipsoid' | 'cartesian' | '';
    setCoordType(nextType);
    
    // Clear out-of-scope fields to maintain exclusivity
    const clearedFields = nextType === 'ellipsoid'
      ? { x: '', y: '', z: '' }
      : nextType === 'cartesian'
      ? { latitude: '', longitude: '', height: '' }
      : { latitude: '', longitude: '', height: '', x: '', y: '', z: '' };

    const nextFormState = {
      ...formState,
      ...clearedFields,
    };
    setFormState(nextFormState);

    // Save choice change immediately
    triggerSave(nextFormState, nextType);
  };

  const getErrorForField = (field: string) => {
    if (error instanceof DomainValidationError) {
      const pathMap: Record<string, string> = {
        astronomicalBody: '/reference-frame/astronomical-body',
        alternateSystem: '/reference-frame/alternate-system',
        geodeticDatum: '/reference-frame/geodetic-system/geodetic-datum',
        coordAccuracy: '/reference-frame/geodetic-system/coord-accuracy',
        heightAccuracy: '/reference-frame/geodetic-system/height-accuracy',
        coordinateType: '/location',
        latitude: '/location/ellipsoid/latitude',
        longitude: '/location/ellipsoid/longitude',
        height: '/location/ellipsoid/height',
        x: '/location/cartesian/x',
        y: '/location/cartesian/y',
        z: '/location/cartesian/z',
      };
      const path = pathMap[field];
      const found = error.errors.find((err: ValidationError) => err.path === path);
      return found ? found.message : undefined;
    }
    return undefined;
  };

  const triggerSave = (currentFormState = formState, currentCoordType = coordType) => {
    let geodeticSystem: GeodeticSystem | undefined;
    if (currentFormState.geodeticDatum || currentFormState.coordAccuracy !== '' || currentFormState.heightAccuracy !== '') {
      geodeticSystem = {
        geodeticDatum: currentFormState.geodeticDatum,
        coordAccuracy: currentFormState.coordAccuracy !== '' ? Number(currentFormState.coordAccuracy) : undefined,
        heightAccuracy: currentFormState.heightAccuracy !== '' ? Number(currentFormState.heightAccuracy) : undefined,
      };
    }

    const referenceFrame: ReferenceFrame = {
      astronomicalBody: currentFormState.astronomicalBody,
      alternateSystem: currentFormState.alternateSystem || undefined,
      geodeticSystem,
    };

    let location: LocationChoice | undefined;
    if (currentCoordType === 'ellipsoid') {
      location = {
        ellipsoid: {
          latitude: currentFormState.latitude !== '' ? (currentFormState.latitude as any) : undefined,
          longitude: currentFormState.longitude !== '' ? (currentFormState.longitude as any) : undefined,
          ...(currentFormState.height !== '' ? { height: currentFormState.height as any } : {}),
        },
      };
    } else if (currentCoordType === 'cartesian') {
      location = {
        cartesian: {
          x: currentFormState.x !== '' ? (currentFormState.x as any) : undefined,
          y: currentFormState.y !== '' ? (currentFormState.y as any) : undefined,
          z: currentFormState.z !== '' ? (currentFormState.z as any) : undefined,
        },
      };
    } else {
      location = undefined;
    }

    const updatedGeoLocation: GeoLocation = {
      referenceFrame,
      location,
    };

    saveGeoLocation(updatedGeoLocation).catch(() => {
      // Ignored: validation errors are propagated to context error property
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSave();
  };

  const handleBlur = () => {
    triggerSave();
  };

  const renderField = (name: string, label: string, type: string = 'text', step?: string) => {
    const fieldError = getErrorForField(name);
    return (
      <div key={name} className={styles.fieldContainer}>
        <label htmlFor={name} className={styles.label}>
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          step={step}
          value={formState[name as keyof typeof formState]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={fieldError ? styles.inputError : styles.input}
        />
        {fieldError && (
          <span
            data-testid={`error-${name}`}
            className={styles.errorMessage}
          >
            {fieldError}
          </span>
        )}
      </div>
    );
  };

  const coordTypeError = getErrorForField('coordinateType');

  return (
    <form
      data-testid="property-grid-form"
      onSubmit={handleSubmit}
      className={styles.form}
    >
      {/* Reference Frame Parameters */}
      {renderField('astronomicalBody', 'Astronomical Body')}
      {activeView !== 'geodetic' && renderField('alternateSystem', 'Alternate System')}
      {activeView !== 'alternate' && renderField('geodeticDatum', 'Geodetic Datum')}
      {activeView !== 'alternate' && renderField('coordAccuracy', 'Coordinate Accuracy', 'number', 'any')}
      {activeView !== 'alternate' && renderField('heightAccuracy', 'Height Accuracy', 'number', 'any')}

      {/* Coordinate Type Dropdown */}
      <div className={styles.fieldContainer}>
        <label htmlFor="coordinateType" className={styles.label}>
          Coordinate Type
        </label>
        <select
          id="coordinateType"
          name="coordinateType"
          value={coordType}
          onChange={handleCoordTypeChange}
          onBlur={handleBlur}
          className={coordTypeError ? styles.inputError : styles.input}
          data-testid="coordinate-type-select"
        >
          <option value="">Unconfigured</option>
          <option value="ellipsoid">Ellipsoid</option>
          <option value="cartesian">Cartesian</option>
        </select>
        {coordTypeError && (
          <span
            data-testid="error-coordinateType"
            className={styles.errorMessage}
          >
            {coordTypeError}
          </span>
        )}
      </div>

      {/* Choice-Exclusive Coordinate Fields */}
      {coordType === 'ellipsoid' && (
        <>
          {renderField('latitude', 'Latitude', 'text')}
          {renderField('longitude', 'Longitude', 'text')}
          {renderField('height', 'Height', 'text')}
        </>
      )}

      {coordType === 'cartesian' && (
        <>
          {renderField('x', 'X Coordinate', 'text')}
          {renderField('y', 'Y Coordinate', 'text')}
          {renderField('z', 'Z Coordinate', 'text')}
        </>
      )}

      <button type="submit" className={styles.submitButton}>
        Save
      </button>
    </form>
  );
};
