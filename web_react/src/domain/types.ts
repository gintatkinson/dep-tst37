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
