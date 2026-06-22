import React, { useState, useRef } from 'react';
import { TopologyMap } from './topology-map';
import { Header } from './header';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className={styles.layoutContainer}>
      <Header onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <div
        data-testid="layout-wrapper"
        ref={wrapperRef}
        className={styles.wrapper}
        style={{
          '--layout-sidebar-width': spacing?.['layout-sidebar-width'] || '280px',
          '--layout-min-pane-size': spacing?.['layout-min-pane-size'] || '150px',
          '--sidebar-width': isSidebarCollapsed ? '64px' : `${sidebarWidth}px`,
          '--topology-height': `${topologyHeight}px`,
        } as React.CSSProperties}
      >
        {/* Navigation Sidebar */}
        <aside
          data-testid="sidebar-nav"
          className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}
        >
          <nav role="navigation">
            <ul className={styles.navTree}>
              <li>
                <div className={styles.navHeaderWrapper}>
                  <svg className={styles.navHeaderIcon} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                  </svg>
                  {!isSidebarCollapsed && <span className={styles.navHeader}>Reference Frame</span>}
                </div>
                <ul>
                  <li>
                    <span
                      className={`${styles.navItem} ${activeView === 'geodetic' ? styles.active : ''}`}
                      onClick={() => onViewChange?.('geodetic')}
                    >
                      <svg className={styles.navIcon} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.66 0 3 1.34 3 3v1.78c.89.4 1.5 1.3 1.5 2.33 0 .73-.32 1.38-.8 1.83z"/>
                      </svg>
                      {!isSidebarCollapsed && 'Geodetic System'}
                    </span>
                  </li>
                  <li>
                    <span
                      className={`${styles.navItem} ${activeView === 'alternate' ? styles.active : ''}`}
                      onClick={() => onViewChange?.('alternate')}
                    >
                      <svg className={styles.navIcon} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2.05L3.5 6.96v9.89L12 21.8l8.5-4.95V6.96L12 2.05zm-1 16.89l-5.5-3.2v-5.9l5.5 3.2v5.9zm1-7.14L6.5 8.6 12 5.4l5.5 3.2L12 11.8zm6.5 3.95l-5.5 3.2v-5.9l5.5-3.2v-5.9z"/>
                      </svg>
                      {!isSidebarCollapsed && 'Alternate System'}
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
          className={`${styles.splitter} ${isSidebarCollapsed ? styles.collapsedSplitter : ''}`}
          onPointerDown={isSidebarCollapsed ? undefined : handleSidebarPointerDown}
          onPointerMove={isSidebarCollapsed ? undefined : handleSidebarPointerMove}
          onPointerUp={isSidebarCollapsed ? undefined : handleSidebarPointerUp}
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
    </div>
  );
};

