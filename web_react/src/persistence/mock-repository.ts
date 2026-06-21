import type { GeoLocationRepository } from './repository';
import type { GeoLocation } from '../domain/types';
import { validateGeoLocation, getDefaultGeoLocation } from '../domain/validation';

export class MockGeoLocationRepository implements GeoLocationRepository {
  private location: GeoLocation | null = null;

  async save(location: GeoLocation): Promise<void> {
    const validated = validateGeoLocation(location);
    this.location = JSON.parse(JSON.stringify(validated));
  }

  async load(): Promise<GeoLocation> {
    if (this.location === null) {
      return JSON.parse(JSON.stringify(getDefaultGeoLocation()));
    }
    return JSON.parse(JSON.stringify(this.location));
  }
}
