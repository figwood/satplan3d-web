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
          top: '10px',
          left: showTreeview ? '260px' : '10px',
          zIndex: 100,
          padding: '5px 10px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          transition: 'left 0.3s'
        }}
      >
        {showTreeview ? '<<' : '>>'}
      </button>
    </>
  );
};

export default SatelliteControls;