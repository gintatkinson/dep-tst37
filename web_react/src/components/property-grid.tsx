import React, { useState } from 'react';
import { useGeoLocation } from '../context/GeoLocationContext';
import { ReferenceFrame, GeodeticSystem } from '../domain/types';
import { DomainValidationError, ValidationError } from '../domain/validation';
import styles from './property-grid.module.css';

export const PropertyGrid: React.FC = () => {
  const { referenceFrame, loading, error, saveFrame } = useGeoLocation();

  const [prevReferenceFrame, setPrevReferenceFrame] = useState<ReferenceFrame | null>(null);
  const [formState, setFormState] = useState({
    astronomicalBody: '',
    alternateSystem: '',
    geodeticDatum: '',
    coordAccuracy: '',
    heightAccuracy: '',
  });

  if (referenceFrame !== prevReferenceFrame) {
    setPrevReferenceFrame(referenceFrame);
    if (referenceFrame) {
      setFormState({
        astronomicalBody: referenceFrame.astronomicalBody || '',
        alternateSystem: referenceFrame.alternateSystem || '',
        geodeticDatum: referenceFrame.geodeticSystem?.geodeticDatum || '',
        coordAccuracy: referenceFrame.geodeticSystem?.coordAccuracy !== undefined ? String(referenceFrame.geodeticSystem.coordAccuracy) : '',
        heightAccuracy: referenceFrame.geodeticSystem?.heightAccuracy !== undefined ? String(referenceFrame.geodeticSystem.heightAccuracy) : '',
      });
    }
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

  const getErrorForField = (field: string) => {
    if (error instanceof DomainValidationError) {
      const pathMap: Record<string, string> = {
        astronomicalBody: '/reference-frame/astronomical-body',
        alternateSystem: '/reference-frame/alternate-system',
        geodeticDatum: '/reference-frame/geodetic-system/geodetic-datum',
        coordAccuracy: '/reference-frame/geodetic-system/coord-accuracy',
        heightAccuracy: '/reference-frame/geodetic-system/height-accuracy',
      };
      const path = pathMap[field];
      const found = error.errors.find((err: ValidationError) => err.path === path);
      return found ? found.message : undefined;
    }
    return undefined;
  };

  const triggerSave = () => {
    let geodeticSystem: GeodeticSystem | undefined;
    if (formState.geodeticDatum || formState.coordAccuracy !== '' || formState.heightAccuracy !== '') {
      geodeticSystem = {
        geodeticDatum: formState.geodeticDatum,
        coordAccuracy: formState.coordAccuracy !== '' ? Number(formState.coordAccuracy) : undefined,
        heightAccuracy: formState.heightAccuracy !== '' ? Number(formState.heightAccuracy) : undefined,
      };
    }

    const frame: ReferenceFrame = {
      astronomicalBody: formState.astronomicalBody,
      alternateSystem: formState.alternateSystem || undefined,
      geodeticSystem,
    };

    const promise = saveFrame(frame);
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Ignored: validation errors are propagated to context error property
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSave();
  };

  const handleBlur = () => {
    triggerSave();
  };

  const fields = [
    { name: 'astronomicalBody', label: 'Astronomical Body', type: 'text' },
    { name: 'alternateSystem', label: 'Alternate System', type: 'text' },
    { name: 'geodeticDatum', label: 'Geodetic Datum', type: 'text' },
    { name: 'coordAccuracy', label: 'Coordinate Accuracy', type: 'number', step: 'any' },
    { name: 'heightAccuracy', label: 'Height Accuracy', type: 'number', step: 'any' },
  ];

  return (
    <form
      data-testid="property-grid-form"
      onSubmit={handleSubmit}
      className={styles.form}
    >
      {fields.map((field) => {
        const fieldError = getErrorForField(field.name);
        return (
          <div key={field.name} className={styles.fieldContainer}>
            <label htmlFor={field.name} className={styles.label}>
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              step={field.step}
              value={formState[field.name as keyof typeof formState]}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldError ? styles.inputError : styles.input}
            />
            {fieldError && (
              <span
                data-testid={`error-${field.name}`}
                className={styles.errorMessage}
              >
                {fieldError}
              </span>
            )}
          </div>
        );
      })}
      <button type="submit" className={styles.submitButton}>
        Save
      </button>
    </form>
  );
};
