import React, { useState, useRef } from 'react';
import styles from './layout.module.css';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clampedWidth = Math.max(180, Math.min(600, newWidth));
      setSidebarWidth(clampedWidth);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDraggingRef.current = false;
    }
  };

  return (
    <div
      data-testid="layout-wrapper"
      ref={wrapperRef}
      className={styles.wrapper}
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
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
      <div
        data-testid="layout-splitter"
        className={styles.splitter}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      ></div>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
