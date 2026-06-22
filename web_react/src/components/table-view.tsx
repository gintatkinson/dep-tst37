import React from 'react';
import styles from './table-view.module.css';

export interface TableViewProps {
  type: 'elements' | 'alarms' | 'events';
}

const BtsIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" data-testid="icon-bts" className={styles.typeIcon}>
    <path d="M12 2c-.55 0-1 .45-1 1v3.28c-1.44.38-2.5 1.68-2.5 3.22 0 1.2.64 2.26 1.61 2.87L5.08 21h2.24l3.1-6.19c.5.12 1.03.19 1.58.19s1.08-.07 1.58-.19L16.68 21h2.24l-5.03-8.63c.97-.61 1.61-1.67 1.61-2.87 0-1.54-1.06-2.84-2.5-3.22V3c0-.55-.45-1-1-1zm0 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5z" />
  </svg>
);

const BscIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" data-testid="icon-bsc" className={styles.typeIcon}>
    <path d="M4 6h16V4H4v2zm0 5h16V9H4v2zm0 5h16v-2H4v2zm0 4h16v-2H4v2z" />
  </svg>
);

// Mock data as specified
const elementsData = [
  { id: '1', name: 'BTS22', type: 'BTS', state: 'Operational:Enabled', alarmCount: '1 M+', severity: 'critical' },
  { id: '2', name: 'London', type: 'BSC', state: 'Operational:Enabled', alarmCount: '1 m', severity: 'minor' },
  { id: '3', name: 'BTS11', type: 'BTS', state: 'Operational:Enabled', alarmCount: '4 W', severity: 'warning' },
];

const alarmsData = [
  { severityCode: 'M+', severity: 'Critical', target: 'BTS22', type: 'Antenna degraded', description: 'Alarm 3_ - Antenna degraded', timestamp: '2026-06-22 08:30:00' },
  { severityCode: 'm', severity: 'Minor', target: 'London', type: 'Cooling fan', description: 'Cooling fan degraded', timestamp: '2026-06-22 08:15:00' },
  { severityCode: 'W', severity: 'Warning', target: 'BTS11', type: 'Signal warning', description: 'Low signal warning', timestamp: '2026-06-22 08:00:00' },
];

const eventsData = [
  { id: 'EV001', type: 'Config Change', description: 'Reference Frame config modified', timestamp: '2026-06-22 08:05:00' },
  { id: 'EV002', type: 'Datum Change', description: 'Datum set to WGS-84', timestamp: '2026-06-22 08:06:00' },
];

/**
 * TableView Component.
 * Implements a high-density, outlined Table representation of node state and environment metrics.
 */
export const TableView: React.FC<TableViewProps> = ({ type }) => {
  if (type === 'elements') {
    return (
      <div className={styles.tableWrapper} data-testid="table-elements">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Object</th>
              <th>Name</th>
              <th>Type</th>
              <th>Primary State</th>
              <th>Alarms Summary</th>
            </tr>
          </thead>
          <tbody>
            {elementsData.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.type === 'BTS' ? <BtsIcon /> : <BscIcon />}
                </td>
                <td className={styles.boldCell}>{row.name}</td>
                <td>{row.type}</td>
                <td>{row.state}</td>
                <td>
                  <span className={`${styles.badge} ${styles[row.severity]}`}>
                    {row.alarmCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'alarms') {
    return (
      <div className={styles.tableWrapper} data-testid="table-alarms">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Target</th>
              <th>Type</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {alarmsData.map((row, index) => {
              const severityClass = 
                row.severityCode === 'M+' ? styles.critical :
                row.severityCode === 'm' ? styles.minor :
                styles.warning;
              return (
                <tr key={index}>
                  <td>
                    <span className={`${styles.badge} ${severityClass}`}>
                      {row.severityCode}
                    </span>
                  </td>
                  <td className={styles.boldCell}>{row.target}</td>
                  <td>{row.type}</td>
                  <td>{row.description}</td>
                  <td className={styles.monoCell}>{row.timestamp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'events') {
    return (
      <div className={styles.tableWrapper} data-testid="table-events">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {eventsData.map((row) => (
              <tr key={row.id}>
                <td className={styles.monoCell}>{row.id}</td>
                <td className={styles.boldCell}>{row.type}</td>
                <td>{row.description}</td>
                <td className={styles.monoCell}>{row.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};
