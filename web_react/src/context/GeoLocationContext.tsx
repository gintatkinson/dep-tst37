/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GeoLocation } from '../domain/types';
import type { GeoLocationRepository } from '../persistence/repository';

export interface GeoLocationContextType {
  geoLocation: GeoLocation | null;
  loading: boolean;
  error: Error | null;
  saveGeoLocation: (location: GeoLocation) => Promise<void>;
}

export const GeoLocationContext = createContext<GeoLocationContextType | undefined>(undefined);

export interface GeoLocationProviderProps {
  repository: GeoLocationRepository;
  children: React.ReactNode;
}

export const GeoLocationProvider: React.FC<GeoLocationProviderProps> = ({ repository, children }) => {
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    repository.load()
      .then((loc) => {
        if (isMounted) {
          setGeoLocation(loc);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [repository]);

  const saveGeoLocation = async (location: GeoLocation) => {
    try {
      setError(null);
      await repository.save(location);
      const updated = await repository.load();
      setGeoLocation(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <GeoLocationContext.Provider value={{ geoLocation, loading, error, saveGeoLocation }}>
      {children}
    </GeoLocationContext.Provider>
  );
};

export const useGeoLocation = (): GeoLocationContextType => {
  const context = useContext(GeoLocationContext);
  if (context === undefined) {
    throw new Error('useGeoLocation must be used within a GeoLocationProvider');
  }
  return context;
};
