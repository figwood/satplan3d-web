import React from 'react';
import styles from '../../styles/SatelliteViewer.module.css';

/**
 * 卫星查看器的控制组件，包含树视图切换等功能
 */
const SatelliteControls = ({ 
  showTreeview, 
  setShowTreeview
}) => {
  
  /**
   * 切换树视图显示状态
   */
  const toggleTreeview = () => {
    setShowTreeview(!showTreeview);
  };
  
  return (
    <>
      {/* 树视图切换按钮 */}
      <button 
        onClick={toggleTreeview}
        className={styles.treeviewToggle}
        style={{
          position: 'absolute',
          top: '60px',
          left: showTreeview ? '280px' : '0px',
          zIndex: 100,
          padding: '8px 12px',
          background: 'rgba(30, 30, 30, 0.85)',
          color: 'white',
          border: 'none',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          transition: 'left 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px'
        }}
      >
        {showTreeview ? '<<' : '>>'}
      </button>
    </>
  );
};

export default SatelliteControls;