import React from 'react';
import { Tree } from 'antd';
import styles from '../../styles/SatelliteViewer.module.css';

/**
 * 卫星数据树形结构组件
 * 显示卫星和传感器的层级结构
 */
const SatelliteTree = ({ 
  satelliteData, 
  selectedNode,
  onSelect,
  onCheck,
  halfSelectedKeys
}) => {

  /**
   * 自定义节点标题渲染
   * @param {Object} nodeData 节点数据
   * @returns {JSX.Element} 渲染的节点内容
   */
  const titleRender = (nodeData) => {
    return (
      <span
        data-half-selected={halfSelectedKeys.includes(nodeData.key)}
        style={{ display: 'block', padding: '0 4px' }}
      >
        {nodeData.title}
      </span>
    );
  };
  
  return (
    <div className={styles.treeview}>
      {satelliteData ? (
        <Tree
          checkable
          onCheck={onCheck}
          onSelect={onSelect}
          selectedKeys={selectedNode ? [selectedNode.key] : []}
          treeData={[satelliteData]}
          defaultExpandAll={true}
          className={`${styles.antTree} ${styles.customTree}`}
          titleRender={titleRender}
          fieldNames={{
            title: 'title',
            key: 'key',
            children: 'children'
          }}
        />
      ) : (
        <p>Loading satellite data...</p>
      )}
    </div>
  );
};

export default SatelliteTree;