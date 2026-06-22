import React, { useState } from 'react';
import styles from './tabbed-container.module.css';

export interface TabItem {
  label: string;
  content: React.ReactNode;
}

export interface TabbedContainerProps {
  tabs: TabItem[];
  defaultActiveIndex?: number;
}

/**
 * TabbedContainer Component.
 * Renders bottom-docked horizontal navigation tabs and handles the active tab state.
 */
export const TabbedContainer: React.FC<TabbedContainerProps> = ({
  tabs,
  defaultActiveIndex = 0,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  return (
    <div className={styles.container} data-testid="tabbed-container">
      <div className={styles.panelContent} data-testid="tab-panel-content">
        {tabs[activeIndex]?.content}
      </div>
      <div className={styles.tabBar} role="tablist" data-testid="tab-bar">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              className={`${styles.tabButton} ${isActive ? styles.activeTab : ''}`}
              onClick={() => setActiveIndex(index)}
              data-testid={`tab-button-${tab.label.toLowerCase()}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
