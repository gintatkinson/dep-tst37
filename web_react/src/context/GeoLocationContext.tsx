/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReferenceFrame } from '../domain/types';
import type { GeoLocationRepository } from '../persistence/repository';

export interface GeoLocationContextType {
  referenceFrame: ReferenceFrame | null;
  loading: boolean;
  error: Error | null;
  saveFrame: (frame: ReferenceFrame) => Promise<void>;
}

export const GeoLocationContext = createContext<GeoLocationContextType | undefined>(undefined);

export interface GeoLocationProviderProps {
  repository: GeoLocationRepository;
  children: React.ReactNode;
}

export const GeoLocationProvider: React.FC<GeoLocationProviderProps> = ({ repository, children }) => {
  const [referenceFrame, setReferenceFrame] = useState<ReferenceFrame | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    repository.load()
      .then((frame) => {
        if (isMounted) {
          setReferenceFrame(frame);
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

  const saveFrame = async (frame: ReferenceFrame) => {
    try {
      setError(null);
      await repository.save(frame);
      const updated = await repository.load();
      setReferenceFrame(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <GeoLocationContext.Provider value={{ referenceFrame, loading, error, saveFrame }}>
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
