import type { GeoLocation } from '../domain/types';

export interface GeoLocationRepository {
  save(location: GeoLocation): Promise<void>;
  load(): Promise<GeoLocation>;
}
