import React, { useState, useEffect } from 'react';
import { Tree } from 'antd';
import styles from '../../styles/SatelliteViewer.module.css';

const SatelliteTree = ({ 
  satelliteData, 
  selectedNode,
  onSelect,
  onCheck,
  halfSelectedKeys = []
}) => {
  const [treeData, setTreeData] = useState([]);

  // 本地转换函数
  const transformToTreeData = (satellites = [], orders = []) => {
    console.log('Transforming data:', { satellites, orders }); // 调试日志

    return [
      {
        title: "卫星列表",
        key: "satellites-root",
        selectable: false,
        children: satellites.map(satellite => ({
          title: satellite.name,
          key: `satellite-${satellite.noard_id}`,
          data: {
            noard_id: satellite.noard_id,
            name: satellite.name,
            hex_color: satellite.hex_color
          },
          children: (satellite.sensors || []).map(sensor => ({
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
          }))
        }))
      },
      {
        title: "观测规划",
        key: "orders-root",
        selectable: false,
        children: orders.map(order => ({
          title: order.order_name,
          key: `order-${order.order_id}`,
          isLeaf: true,
          data: {
            order_id: order.order_id,
            name: order.order_name,
            hex_color: order.hex_color
          }
        }))
      }
    ];
  };

  useEffect(() => {
    if (satelliteData) {
      console.log('Received satellite data:', satelliteData); // 调试日志
      const transformedData = transformToTreeData(
        satelliteData.satellites || [],
        satelliteData.orders || []
      );
      setTreeData(transformedData);
    }
  }, [satelliteData]);

  const titleRender = (nodeData) => {
    const color = nodeData.data?.hex_color || '#FFFFFF';
    
    return (
      <span
        data-half-selected={halfSelectedKeys.includes(nodeData.key)}
        className={styles.treeNodeLabel}
        style={{ 
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
      <Tree
        checkable
        onCheck={onCheck}
        onSelect={onSelect}
        selectedKeys={selectedNode ? [selectedNode.key] : []}
        treeData={treeData}
        defaultExpandAll={true}
        className={`${styles.antTree} ${styles.customTree}`}
        titleRender={titleRender}
        fieldNames={{
          title: 'title',
          key: 'key',
          children: 'children'
        }}
      />
    </div>
  );
};

export default SatelliteTree;