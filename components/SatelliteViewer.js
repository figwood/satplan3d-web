import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';
import styles from '../styles/SatelliteViewer.module.css';

// 导入拆分的组件和工具函数
import { fetchSatelliteData } from '../utils/satellite/apiService';
import { initCesiumViewer, setupCameraEvents } from '../utils/satellite/cesiumUtils';
import { SatelliteVisualizer } from '../components/satellite/SatelliteVisualizer';
import SatelliteTree from '../components/satellite/SatelliteTree';
import SatelliteControls from '../components/satellite/SatelliteControls';

/**
 * 卫星查看器主组件
 * 整合所有卫星可视化相关的功能
 */
const SatelliteViewer = () => {
  // 基础状态和引用
  const viewerRef = useRef(null); // Cesium 查看器实例
  const cesiumContainerRef = useRef(null); // Cesium 容器元素
  const creditsRef = useRef(null); // 用于隐藏 credits 的容器元素
  const visualizerRef = useRef(null); // 卫星可视化处理类实例
  
  // 组件状态
  const [cameraHeight, setCameraHeight] = useState(null);
  const [showTreeview, setShowTreeview] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [halfSelectedKeys, setHalfSelectedKeys] = useState([]);

  /**
   * 初始化 Cesium 查看器
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 创建 credits 容器
    const creditsContainer = document.createElement('div');
    creditsContainer.style.display = 'none';
    creditsRef.current = creditsContainer;
    
    // 初始化 Cesium 查看器
    const viewer = initCesiumViewer(cesiumContainerRef.current, creditsContainer);
    if (viewer) {
      viewerRef.current = viewer;
      
      // 设置相机事件以更新相机高度
      setupCameraEvents(viewer, setCameraHeight);
      
      // 创建卫星可视化处理类实例
      visualizerRef.current = new SatelliteVisualizer(viewer);
      
      // 加载卫星数据
      loadSatelliteData();
    }
    
    // 清理函数
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);
  
  /**
   * 加载卫星数据
   */
  const loadSatelliteData = async () => {
    try {
      const data = await fetchSatelliteData();
      setSatelliteData(data);
    } catch (error) {
      console.error('加载卫星数据失败:', error);
    }
  };

  /**
   * 处理树节点选择事件
   */
  const onSelect = async (selectedKeys, info) => {
    if (!info.node) return;
    // 只更新选中节点状态
    setSelectedNode(info.node);
  };

  /**
   * 处理树节点选中状态变化
   */
  const onCheck = async (checkedKeys, info) => {
    if (!viewerRef.current || !visualizerRef.current) return;
    
    // 直接使用可视化处理类处理节点选中状态变化
    await visualizerRef.current.handleNodesCheck(info.checkedNodes);
  };

  return (
    <div className={styles.fullscreenContainer} style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      display: 'block',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* 控制组件 */}
      <SatelliteControls 
        showTreeview={showTreeview}
        setShowTreeview={setShowTreeview}
      />
      
      {/* 卫星数据树形结构面板 */}
      <div 
        className={styles.treeviewPanel}
        style={{
          position: 'absolute',
          width: '250px',
          height: '100%',
          backgroundColor: 'rgba(30, 30, 30, 0.85)',
          color: 'white',
          left: showTreeview ? '0' : '-250px',
          top: 0,
          padding: '10px',
          boxSizing: 'border-box',
          zIndex: 99,
          transition: 'left 0.3s',
          overflow: 'auto'
        }}
      >
        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Satellite Data</h3>
        <SatelliteTree 
          satelliteData={satelliteData}
          selectedNode={selectedNode}
          onSelect={onSelect}
          onCheck={onCheck}
          halfSelectedKeys={halfSelectedKeys}
        />
      </div>
      
      {/* Cesium 容器 */}
      <div 
        id="cesiumContainer" 
        ref={cesiumContainerRef} 
        className={styles.cesiumContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          width: '100%',
          height: '100%'
        }}
      ></div>
    </div>
  );
};

export default SatelliteViewer;