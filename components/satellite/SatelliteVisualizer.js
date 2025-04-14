import * as Cesium from 'cesium';
import { 
  addSatelliteEntity, 
  addOrbitPath, 
  addSensorPaths, 
  updateClockSettings 
} from '../../utils/satellite/cesiumUtils';
import { 
  fetchTrackPoints, 
  fetchPathPoints 
} from '../../utils/satellite/apiService';
import { generatePositionsFromTrackPoints } from '../../utils/satellite/orbitUtils';

/**
 * 卫星可视化处理类
 * 负责处理所有与卫星可视化相关的操作
 */
export class SatelliteVisualizer {
  constructor(viewer) {
    this.viewer = viewer;
  }

  /**
   * 清除特定类型的实体
   * @param {Array<string>} entityTypes 要清除的实体类型名称数组
   * @param {string} specificName 特定实体名称(可选)
   */
  clearEntities(entityTypes = [], specificName = null) {
    if (!this.viewer) return;
    
    this.viewer.entities.values.forEach(entity => {
      if (entityTypes.some(type => entity.name?.includes(type))) {
        if (!specificName || entity.name?.includes(specificName)) {
          this.viewer.entities.remove(entity);
        }
      }
    });
  }
  
  /**
   * 清除所有实体
   */
  clearAllEntities() {
    if (this.viewer) {
      this.viewer.entities.removeAll();
    }
  }

  /**
   * 清除传感器路径和目标区域
   */
  clearPathsAndTargets() {
    if (!this.viewer) return;
    
    // 清除所有与传感器路径和目标区域相关的实体
    const entitiesToRemove = [];
    
    this.viewer.entities.values.forEach(entity => {
      // 清除所有观测机会多边形
      if (entity.name?.includes('观测机会')) {
        entitiesToRemove.push(entity);
      }
      
      // 清除所有传感器路径
      if (entity.name?.includes('Path') || entity.name?.includes('路径')) {
        entitiesToRemove.push(entity);
      }
    });
    
    entitiesToRemove.forEach(entity => {
      this.viewer.entities.remove(entity);
    });
  }

  /**
   * 处理节点选择事件
   * @param {Object} node 选中的节点数据
   */
  async handleNodeSelect(node) {
    if (!this.viewer || !node || !node.data) return;
    
    const { name, noard_id, hex_color, satellite_hex_color, sensorName } = node.data;
    
    try {
      // 获取轨道点数据
      const trackPoints = await fetchTrackPoints(noard_id);
      if (trackPoints && trackPoints.length > 0) {
        const points = generatePositionsFromTrackPoints(trackPoints);
        
        // 轨道始终使用卫星的颜色
        // 如果是传感器节点，使用 satellite_hex_color
        // 如果是卫星节点，使用 hex_color
        const satelliteColor = Cesium.Color.fromCssColorString(
          satellite_hex_color || hex_color || '#FFFFFF'
        );
        
        // 显示卫星轨道
        addOrbitPath(this.viewer, points, name, satelliteColor);
        updateClockSettings(this.viewer, trackPoints);
      }

      // 如果是传感器节点，显示传感器路径
      if (node.isLeaf && sensorName) {
        const pathPoints = await fetchPathPoints(noard_id, sensorName);
        if (pathPoints && pathPoints.length > 0) {
          // 传感器路径使用传感器的颜色
          const sensorColor = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
          addSensorPaths(this.viewer, pathPoints, sensorName, sensorColor);
        }
      }
    } catch (error) {
      console.error('处理节点可视化失败:', error);
    }
  }
  
  /**
   * 处理节点选中状态变化事件
   * @param {Array} checkedNodes 被选中的所有节点
   */
  async handleNodesCheck(checkedNodes) {
    if (!this.viewer) return;
    
    // 清除所有实体
    this.clearAllEntities();
    
    // 不添加卫星实体和轨迹，保持3D视图为空
  }
}