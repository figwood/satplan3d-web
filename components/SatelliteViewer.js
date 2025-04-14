import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';
import { DatePicker, Select, Button } from 'antd';
import dayjs from 'dayjs';
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
  const drawHandlerRef = useRef(null); // 绘制处理程序引用
  const rectangleEntityRef = useRef(null); // 矩形实体引用
  
  // 组件状态
  const [cameraHeight, setCameraHeight] = useState(null);
  const [showTreeview, setShowTreeview] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [halfSelectedKeys, setHalfSelectedKeys] = useState([]);
  
  // 规划相关状态
  const [planStartDate, setPlanStartDate] = useState(dayjs()); // 使用dayjs创建今天的日期
  const [planPeriod, setPlanPeriod] = useState(3); // 默认3天
  const [isDrawingArea, setIsDrawingArea] = useState(false);

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

  /**
   * 处理规划开始日期变化
   */
  const onDateChange = (date) => {
    setPlanStartDate(date);
  };

  /**
   * 处理规划时间段变化
   */
  const onPeriodChange = (value) => {
    setPlanPeriod(value);
  };

  /**
   * 处理绘制目标区域按钮点击
   */
  const onDrawTargetArea = () => {
    if (!viewerRef.current) return;
    
    // 切换绘制状态
    setIsDrawingArea(!isDrawingArea);
    
    // 如果已经在绘制中，取消绘制
    if (isDrawingArea) {
      if (drawHandlerRef.current) {
        drawHandlerRef.current.destroy();
        drawHandlerRef.current = null;
      }
      
      // 恢复相机控制
      viewerRef.current.scene.screenSpaceCameraController.enableInputs = true;
      return;
    }

    // 清除现有的矩形实体（包括任何先前绘制的区域）
    if (rectangleEntityRef.current) {
      viewerRef.current.entities.remove(rectangleEntityRef.current);
      rectangleEntityRef.current = null;
    }
    
    // 如果开始绘制，初始化绘制模式
    const viewer = viewerRef.current;
    const scene = viewer.scene;
    
    // 提示用户当前处于绘制模式
    console.log("请在地图上点击并拖动鼠标绘制矩形区域");
    
    // 设置鼠标模式为绘制
    scene.screenSpaceCameraController.enableInputs = false;
    
    // 创建绘制处理器
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    drawHandlerRef.current = handler;
    
    let startPosition = null;
    let startCartographic = null;
    
    // 使用Primitive方式替代Entity，提高性能
    let rectangleInstance = null;
    let rectanglePrimitive = null;
    
    // 清理函数
    const cleanupDrawing = () => {
      if (rectanglePrimitive) {
        scene.primitives.remove(rectanglePrimitive);
      }
      
      if (handler) {
        handler.destroy();
      }
      drawHandlerRef.current = null;
      
      // 恢复相机控制
      scene.screenSpaceCameraController.enableInputs = true;
      
      // 调整绘制状态
      setIsDrawingArea(false);
    };
    
    // 鼠标按下事件，记录起始点
    handler.setInputAction((movement) => {
      const cartesian = viewer.camera.pickEllipsoid(
        movement.position, 
        scene.globe.ellipsoid
      );
      
      if (cartesian) {
        // 清理之前的图元
        if (rectanglePrimitive) {
          scene.primitives.remove(rectanglePrimitive);
        }
        
        startPosition = cartesian;
        startCartographic = Cesium.Cartographic.fromCartesian(cartesian);
        
        // 创建初始矩形几何体
        const rectangleGeometry = new Cesium.RectangleGeometry({
          rectangle: new Cesium.Rectangle(
            startCartographic.longitude,
            startCartographic.latitude,
            startCartographic.longitude,
            startCartographic.latitude
          ),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        });
        
        // 创建矩形实例
        rectangleInstance = new Cesium.GeometryInstance({
          geometry: rectangleGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              new Cesium.Color(1.0, 0.0, 0.0, 0.5)
            ),
            show: new Cesium.ShowGeometryInstanceAttribute(true)
          },
          id: 'rectangle'
        });
        
        // 创建图元
        rectanglePrimitive = new Cesium.Primitive({
          geometryInstances: rectangleInstance,
          appearance: new Cesium.PerInstanceColorAppearance({
            flat: true,
            translucent: true
          }),
          asynchronous: false
        });
        
        // 添加到场景
        scene.primitives.add(rectanglePrimitive);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    
    // 鼠标移动事件，更新矩形终点
    handler.setInputAction((movement) => {
      if (!startPosition || !startCartographic) return;
      
      const cartesian = viewer.camera.pickEllipsoid(
        movement.endPosition, 
        scene.globe.ellipsoid
      );
      
      if (cartesian) {
        const endCartographic = Cesium.Cartographic.fromCartesian(cartesian);
        
        const west = Math.min(startCartographic.longitude, endCartographic.longitude);
        const east = Math.max(startCartographic.longitude, endCartographic.longitude);
        const south = Math.min(startCartographic.latitude, endCartographic.latitude);
        const north = Math.max(startCartographic.latitude, endCartographic.latitude);
        
        // 每次移动都清除之前的图元并创建新的图元
        // 这样比修改现有图元的属性更高效
        if (rectanglePrimitive) {
          scene.primitives.remove(rectanglePrimitive);
        }
        
        // 创建新的矩形几何体
        const rectangleGeometry = new Cesium.RectangleGeometry({
          rectangle: new Cesium.Rectangle(west, south, east, north),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        });
        
        // 创建矩形实例
        rectangleInstance = new Cesium.GeometryInstance({
          geometry: rectangleGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              new Cesium.Color(1.0, 0.0, 0.0, 0.5)
            ),
            show: new Cesium.ShowGeometryInstanceAttribute(true)
          },
          id: 'rectangle'
        });
        
        // 创建图元
        rectanglePrimitive = new Cesium.Primitive({
          geometryInstances: rectangleInstance,
          appearance: new Cesium.PerInstanceColorAppearance({
            flat: true,
            translucent: true
          }),
          asynchronous: false
        });
        
        // 添加到场景
        scene.primitives.add(rectanglePrimitive);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    // 鼠标释放事件，完成绘制
    handler.setInputAction(() => {
      if (!startPosition || !rectangleInstance) {
        cleanupDrawing();
        return;
      }
      
      // 完成绘制，将临时的矩形Primitive转换为持久的Entity
      const currentRectangle = rectangleInstance.geometry._rectangle;
      
      if (currentRectangle) {
        // 清理临时绘制图元
        if (rectanglePrimitive) {
          scene.primitives.remove(rectanglePrimitive);
        }
        
        // 创建最终的矩形实体
        rectangleEntityRef.current = viewer.entities.add({
          rectangle: {
            coordinates: currentRectangle,
            material: new Cesium.ColorMaterialProperty(
              Cesium.Color.RED.withAlpha(0.3)
            ),
            outline: true,
            outlineColor: Cesium.Color.RED,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });
        
        console.log("绘制的矩形区域:", {
          west: Cesium.Math.toDegrees(currentRectangle.west),
          south: Cesium.Math.toDegrees(currentRectangle.south),
          east: Cesium.Math.toDegrees(currentRectangle.east),
          north: Cesium.Math.toDegrees(currentRectangle.north)
        });
      }
      
      cleanupDrawing();
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
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
      
      {/* 标题和规划控制面板 */}
      <div 
        className={styles.titleAndPlanningPanel}
        style={{
          position: 'absolute',
          top: '10px',
          left: showTreeview ? '290px' : '40px',
          right: '200px', // Adjusted to leave space for the Cesium toolbar controls
          zIndex: 100,
          transition: 'left 0.3s',
          color: 'white'
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Satellite Orbit Visualization</h2>
        
        <div 
          className={styles.planningControlPanel}
          style={{
            backgroundColor: 'rgba(30, 30, 30, 0.85)',
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
            <span style={{ marginRight: '10px' }}>规划开始时间:</span>
            <DatePicker 
              onChange={onDateChange} 
              value={planStartDate}
              style={{ width: '150px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
            <span style={{ marginRight: '10px' }}>规划时间段:</span>
            <Select
              value={planPeriod}
              onChange={onPeriodChange}
              style={{ width: '120px' }}
              options={[{ value: 3, label: '未来三天' }]}
            />
          </div>

          <Button 
            type={isDrawingArea ? 'primary' : 'default'}
            onClick={onDrawTargetArea}
          >
            绘制目标区域
          </Button>
        </div>
      </div>
      
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