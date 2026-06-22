import React from 'react';
import { useGeoLocation } from '../context/GeoLocationContext';
import styles from './topology-map.module.css';

/**
 * TopologyMap Component.
 * Renders an SVG-based grid map standardizing on the 8px grid system.
 * Plots geographic location using coordinate projection.
 *
 * @realizes UML:TopologyMap
 * @returns {React.ReactElement} The rendered topology map component.
 */
export const TopologyMap: React.FC = (): React.ReactElement => {
  const { geoLocation } = useGeoLocation();

  const hasEllipsoid = !!geoLocation?.location?.ellipsoid;
  const hasCartesian = !!geoLocation?.location?.cartesian;

  // Projection logic
  let markerX: number | null = null;
  let markerY: number | null = null;
  let labelText = '';

  if (hasEllipsoid && geoLocation?.location?.ellipsoid) {
    const { latitude, longitude } = geoLocation.location.ellipsoid;
    // Map lat [-90, 90] to y [800, 0]
    markerY = ((90 - latitude) / 180) * 800;
    // Map lon [-180, 180] to x [0, 800]
    markerX = ((longitude + 180) / 360) * 800;
    labelText = `LAT: ${latitude}, LON: ${longitude}`;
  } else if (hasCartesian && geoLocation?.location?.cartesian) {
    const { x, y, z } = geoLocation.location.cartesian;
    // Isometric/Orthographic 3D projection onto 2D viewport
    // x range is typically in millions of meters (e.g. Earth radius ~6.37e6)
    const R = 10000000; // 10,000 km scale
    const x2d = (x - y) * 0.866;
    const y2d = (x + y) * 0.5 - z;
    // Map range [-R, R] to [40, 760] (giving padding)
    markerX = Math.min(760, Math.max(40, (x2d / R) * 400 + 400));
    markerY = Math.min(760, Math.max(40, (y2d / R) * 400 + 400));
    labelText = `X: ${x}, Y: ${y}, Z: ${z}`;
  }

  // Generate grid lines
  const gridLines = [];
  const spacing = 32; // Standardize on 8px grid system; 32px is a multiple of 8 (4 * 8px)
  
  // Render grid lines for 800x800 viewBox
  for (let i = 0; i <= 800; i += spacing) {
    const isMajor = i % 64 === 0;
    const className = isMajor ? styles.gridLineMajor : styles.gridLineMinor;
    
    // Vertical line
    gridLines.push(
      <line key={`v-${i}`} x1={i} y1={0} x2={i} y2={800} className={className} />
    );
    // Horizontal line
    gridLines.push(
      <line key={`h-${i}`} x1={0} y1={i} x2={800} y2={i} className={className} />
    );
  }

  // Generate label ticks
  const ticks = [];
  for (let i = 128; i < 800; i += 128) {
    ticks.push(
      <text key={`tx-${i}`} x={i} y={15} className={styles.coordinateMarker} textAnchor="middle">
        {String(i).padStart(3, '0')}
      </text>
    );
    ticks.push(
      <text key={`ty-${i}`} x={5} y={i + 3} className={styles.coordinateMarker}>
        {String(i).padStart(3, '0')}
      </text>
    );
  }

  const isConfigured = markerX !== null && markerY !== null;

  return (
    <div className={styles.container} data-testid="topology-map">
      <div className={styles.header}>
        <div className={styles.title}>Geographic Position Map</div>
        <div className={styles.statusIndicator}>
          <span
            data-testid="status-dot"
            className={`${styles.statusDot} ${isConfigured ? styles.statusDotActive : ''}`}
          />
          <span>{isConfigured ? 'RESOLVED' : 'UNCONFIGURED'}</span>
        </div>
      </div>

      <div className={styles.mapArea} data-testid="map-area">
        <div className={styles.scanline} />
        
        {/* Console Dashboard Overlay */}
        <div className={styles.dashboardOverlay} data-testid="dashboard-overlay">
          <div className={styles.dashboardMetric}>
            <span className={styles.metricLabel}>Datum:</span>
            <span className={styles.metricValue}>
              {geoLocation?.referenceFrame?.geodeticSystem?.geodeticDatum || 'WGS-84'}
            </span>
          </div>
          <div className={styles.dashboardMetric}>
            <span className={styles.metricLabel}>System:</span>
            <span className={styles.metricValue}>
              {hasEllipsoid ? 'Ellipsoidal' : hasCartesian ? 'Cartesian' : 'Unconfigured'}
            </span>
          </div>
          <div className={styles.dashboardMetric}>
            <span className={styles.metricLabel}>Status:</span>
            <div className={styles.dashboardStatus}>
              <span
                data-testid="dashboard-status-dot"
                className={`${styles.dashboardStatusDot} ${
                  isConfigured ? styles.statusDotActivePulse : styles.statusDotNeutral
                }`}
              />
              <span className={styles.metricValue}>{isConfigured ? 'RESOLVED' : 'UNCONFIGURED'}</span>
            </div>
          </div>
        </div>

        <svg viewBox="0 0 800 800" className={styles.svgMap} data-testid="svg-grid">
          {/* Background grid */}
          <g>{gridLines}</g>
          {/* Coordinate axis labels */}
          <g>{ticks}</g>

          {/* Plot marker if configured */}
          {isConfigured && markerX !== null && markerY !== null && (
            <g data-testid="coordinate-marker">
              {/* Full grid crosshair overlay lines */}
              <line x1={0} y1={markerY} x2={800} y2={markerY} className={styles.crosshairLine} />
              <line x1={markerX} y1={0} x2={markerX} y2={800} className={styles.crosshairLine} />
              
              {/* Pulsing glow ring */}
              <circle cx={markerX} cy={markerY} r={12} className={styles.crosshairRing} />
              
              {/* Center crosshair dot */}
              <circle cx={markerX} cy={markerY} r={3} className={styles.crosshairCenter} />
              
              {/* Small SVG coordinate tag */}
              <g transform={`translate(${markerX + 8}, ${markerY - 8})`}>
                <rect
                  x={0}
                  y={-14}
                  width={Math.max(120, labelText.length * 5)}
                  height={18}
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke="#38bdf8"
                  strokeWidth={0.5}
                  rx={2}
                />
                <text x={5} y={-2} fill="#38bdf8" fontSize={9} fontFamily="var(--mono)">
                  {labelText}
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Console details overlay */}
        {isConfigured ? (
          <div className={styles.infoOverlay} data-testid="info-overlay">
            <div className={styles.infoLine} style={{ color: '#38bdf8', fontWeight: 'bold' }}>
              RESOLVED POSITION
            </div>
            <div className={styles.infoLine} data-testid="info-label">
              {labelText}
            </div>
            {hasEllipsoid && (
              <div className={styles.infoLine} style={{ color: '#64748b', fontSize: '9px' }}>
                System: Ellipsoidal Geodetic Model
              </div>
            )}
            {hasCartesian && (
              <div className={styles.infoLine} style={{ color: '#64748b', fontSize: '9px' }}>
                System: 3D Cartesian ECEF Model
              </div>
            )}
          </div>
        ) : (
          <div className={styles.infoOverlay} data-testid="info-overlay">
            <div className={styles.unconfigured}>Coordinates Unconfigured</div>
          </div>
        )}
      </div>
    </div>
  );
};
