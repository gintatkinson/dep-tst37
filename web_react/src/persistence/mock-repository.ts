import type { GeoLocationRepository } from './repository';
import type { ReferenceFrame } from '../domain/types';
import { validateReferenceFrame, getDefaultReferenceFrame } from '../domain/validation';

export class MockGeoLocationRepository implements GeoLocationRepository {
  private frame: ReferenceFrame | null = null;

  async save(frame: ReferenceFrame): Promise<void> {
    const validated = validateReferenceFrame(frame);
    this.frame = JSON.parse(JSON.stringify(validated));
  }

  async load(): Promise<ReferenceFrame> {
    if (this.frame === null) {
      return JSON.parse(JSON.stringify(getDefaultReferenceFrame()));
    }
    return JSON.parse(JSON.stringify(this.frame));
  }
}
