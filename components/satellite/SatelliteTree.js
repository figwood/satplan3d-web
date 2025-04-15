import React from 'react';
import { Tree } from 'antd';
import styles from '../../styles/SatelliteViewer.module.css';

/**
 * 将原始卫星数据转换为树形结构
 * @param {Array} satellites 原始卫星数据数组
 * @returns {Object} 树形结构数据
 */
export const transformSatelliteData = (satellites) => {
  if (!Array.isArray(satellites)) {
    console.error('transformSatelliteData: 输入必须是数组');
    return null;
  }

  return {
    title: "卫星列表",
    key: "satellites-root",
    children: satellites.map(satellite => ({
      title: satellite.name,
      key: `satellite-${satellite.noard_id}`,
      data: {
        noard_id: satellite.noard_id,
        name: satellite.name,
        hex_color: satellite.hex_color
      },
      children: satellite.sensors?.map(sensor => ({
        title: sensor.name,
        key: `satellite-${satellite.noard_id}-sensor-${sensor.name}`,
        isLeaf: true,
        data: {
          noard_id: satellite.noard_id,
          name: sensor.name,
          resolution: sensor.resolution,
          right_side_angle: sensor.right_side_angle,
          left_side_angle: sensor.left_side_angle,
          init_angle: sensor.init_angle,
          observe_angle: sensor.observe_angle,
          cur_side_angle: sensor.cur_side_angle,
          satellite_hex_color: satellite.hex_color,
          hex_color: sensor.hex_color
        }
      })) || []
    }))
  };
};

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
    const color = nodeData.data?.hex_color || '#FFFFFF';
    
    return (
      <span
        data-half-selected={halfSelectedKeys.includes(nodeData.key)}
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '8px',
          padding: '0 4px' 
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            backgroundColor: color,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '2px'
          }}
        />
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