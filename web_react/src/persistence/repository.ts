import { ReferenceFrame } from '../domain/types';

export interface GeoLocationRepository {
  save(frame: ReferenceFrame): Promise<void>;
  load(): Promise<ReferenceFrame>;
}
