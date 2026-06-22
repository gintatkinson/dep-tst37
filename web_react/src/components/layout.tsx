import React, { useState, useRef } from 'react';
import { TopologyMap } from './topology-map';
import styles from './layout.module.css';

interface LayoutProps {
  children?: React.ReactNode;
  activeView?: 'geodetic' | 'alternate' | 'all';
  onViewChange?: (view: 'geodetic' | 'alternate' | 'all') => void;
  spacing?: { 'layout-min-pane-size'?: string; 'layout-sidebar-width'?: string; [key: string]: any };
}

/**
 * Layout Component.
 * Implements a split workspace layout with resizable sidebar and horizontal workspace split.
 * Contains sidebar-nav, topology-pane (TopologyMap), details-pane (children/PropertyGrid).
 *
 * @realizes UML:Layout
 * @returns {React.ReactElement} The rendered Sidebar and Split Workspace layout.
 */
export const Layout: React.FC<LayoutProps> = ({ children, activeView = 'all', onViewChange, spacing }) => {
  const minPaneSize = parseInt(spacing?.['layout-min-pane-size'] || '150px', 10);

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [topologyHeight, setTopologyHeight] = useState(400);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  
  const isDraggingSidebarRef = useRef(false);
  const isDraggingWorkspaceRef = useRef(false);

  // Sidebar drag handlers
  const handleSidebarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingSidebarRef.current = true;
  };

  const handleSidebarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSidebarRef.current) return;
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const minSidebarWidth = minPaneSize;
      const clampedWidth = Math.max(minSidebarWidth, Math.min(600, newWidth));
      setSidebarWidth(clampedWidth);
    }
  };

  const handleSidebarPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSidebarRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDraggingSidebarRef.current = false;
    }
  };

  // Workspace horizontal split drag handlers
  const handleWorkspacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingWorkspaceRef.current = true;
  };

  const handleWorkspacePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWorkspaceRef.current) return;
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;
      const minHeight = minPaneSize;
      const maxHeight = Math.max(minHeight, rect.height - minHeight);
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setTopologyHeight(clampedHeight);
    }
  };

  const handleWorkspacePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingWorkspaceRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDraggingWorkspaceRef.current = false;
    }
  };

  return (
    <div
      data-testid="layout-wrapper"
      ref={wrapperRef}
      className={styles.wrapper}
      style={{
        '--layout-sidebar-width': spacing?.['layout-sidebar-width'] || '280px',
        '--layout-min-pane-size': spacing?.['layout-min-pane-size'] || '150px',
        '--sidebar-width': `${sidebarWidth}px`,
        '--topology-height': `${topologyHeight}px`,
      } as React.CSSProperties}
    >
      {/* Navigation Sidebar */}
      <aside data-testid="sidebar-nav" className={styles.sidebar}>
        <nav role="navigation">
          <ul className={styles.navTree}>
            <li>
              <span className={styles.navHeader}>Reference Frame</span>
              <ul>
                <li>
                  <span
                    className={`${styles.navItem} ${activeView === 'geodetic' ? styles.active : ''}`}
                    onClick={() => onViewChange?.('geodetic')}
                  >
                    Geodetic System
                  </span>
                </li>
                <li>
                  <span
                    className={`${styles.navItem} ${activeView === 'alternate' ? styles.active : ''}`}
                    onClick={() => onViewChange?.('alternate')}
                  >
                    Alternate System
                  </span>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Sidebar Resizer Splitter */}
      <div
        data-testid="layout-splitter"
        className={styles.splitter}
        onPointerDown={handleSidebarPointerDown}
        onPointerMove={handleSidebarPointerMove}
        onPointerUp={handleSidebarPointerUp}
      ></div>

      {/* Main Workspace Split Layout */}
      <main
        ref={workspaceRef}
        className={styles.workspace}
        data-testid="workspace-content"
      >
        <div
          data-testid="topology-pane"
          className={styles.topologyPane}
        >
          <TopologyMap />
        </div>
        
        <div
          data-testid="workspace-splitter"
          className={styles.workspaceSplitter}
          onPointerDown={handleWorkspacePointerDown}
          onPointerMove={handleWorkspacePointerMove}
          onPointerUp={handleWorkspacePointerUp}
        ></div>

        <div
          data-testid="details-pane"
          className={styles.detailsPane}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
