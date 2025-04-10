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
   * 处理节点选择事件
   * @param {Object} node 选中的节点数据
   */
  async handleNodeSelect(node) {
    // 选择节点时不执行任何操作
    return;
  }
  
  /**
   * 处理节点选中状态变化事件
   * @param {Array} checkedNodes 被选中的所有节点
   */
  async handleNodesCheck(checkedNodes) {
    if (!this.viewer) return;
    
    // 清除所有实体
    this.clearAllEntities();
    
    // 添加所有选中的节点
    for (const node of checkedNodes) {
      if (node.data) {
        const { name, noard_id, hex_color, sensorName } = node.data;
        const color = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
        
        try {
          // 获取轨道点数据
          const trackPoints = await fetchTrackPoints(noard_id);
          if (trackPoints && trackPoints.length > 0) {
            const points = generatePositionsFromTrackPoints(trackPoints);
            addOrbitPath(this.viewer, points, name, color);
            addSatelliteEntity(this.viewer, trackPoints[0], name, color);
            updateClockSettings(this.viewer, trackPoints);
          }

          // 如果是传感器节点，获取并显示传感器路径
          if (node.isLeaf && sensorName) {
            const pathPoints = await fetchPathPoints(noard_id, sensorName);
            if (pathPoints && pathPoints.length > 0) {
              addSensorPaths(this.viewer, pathPoints, sensorName, color);
            }
          }
        } catch (error) {
          console.error('处理节点可视化失败:', error);
        }
      }
    }
  }
}