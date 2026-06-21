import type { GeoLocationRepository } from './repository';
import type { ReferenceFrame } from '../domain/types';
import { validateReferenceFrame, getDefaultReferenceFrame } from '../domain/validation';

export class MockGeoLocationRepository implements GeoLocationRepository {
  private frame: ReferenceFrame | null = null;

  async save(frame: ReferenceFrame): Promise<void> {
    validateReferenceFrame(frame);
    this.frame = { ...frame };
  }

  async load(): Promise<ReferenceFrame> {
    if (this.frame === null) {
      return getDefaultReferenceFrame();
    }
    return { ...this.frame };
  }
}
