import React from 'react';
import styles from './layout.module.css';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div data-testid="layout-wrapper" className={styles.wrapper}>
      <aside data-testid="sidebar-nav" className={styles.sidebar}>
        <nav role="navigation">
          <ul className={styles.navTree}>
            <li>
              <span className={styles.navHeader}>Reference Frame</span>
              <ul>
                <li>
                  <span className={styles.navItem}>Geodetic System</span>
                </li>
                <li>
                  <span className={styles.navItem}>Alternate System</span>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>
      <div data-testid="layout-splitter" className={styles.splitter}></div>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
