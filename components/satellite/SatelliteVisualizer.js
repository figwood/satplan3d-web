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
    
    const entities = this.viewer.entities.values;
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (!entity.name) continue;
      
      // 检查是否为特定名称的实体
      if (specificName && entity.name === specificName) {
        this.viewer.entities.remove(entity);
        continue;
      }
      
      // 检查实体类型
      const matchesType = entityTypes.some(type => 
        entity.name.includes(type)
      );
      
      if (matchesType) {
        this.viewer.entities.remove(entity);
      }
    }
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
    if (!this.viewer || !node || !node.data) {
      console.log('处理节点选择失败 - 无效参数');
      return;
    }
    
    try {
      // 从节点数据中获取卫星和传感器信息
      const { noard_id, name, sensorName, hex_color } = node.data;
      
      if (!noard_id) {
        console.log('错误 - 缺少 noard_id');
        return;
      }
      
      // 清除现有的路径线和轨道
      this.clearEntities(['Path 1', 'Path 2', 'Orbit'], name);
      
      // 为所有选择的节点显示轨道
      const color = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
      
      try {
        const trackPoints = await fetchTrackPoints(noard_id);
        
        if (trackPoints && trackPoints.length > 0) {
          const points = generatePositionsFromTrackPoints(trackPoints);
          
          // 添加轨道线
          addOrbitPath(this.viewer, points, name, color);
          
          // 添加卫星实体
          addSatelliteEntity(this.viewer, trackPoints[0], name, color);
          
          // 更新时钟设置
          updateClockSettings(this.viewer, trackPoints);
        }
      } catch (error) {
        console.error('获取轨道数据出错:', error);
      }
      
      // 如果是传感器节点，还需要显示传感器路径
      if (node.isLeaf && sensorName) {
        try {
          const pathPoints = await fetchPathPoints(noard_id, sensorName);
          
          if (pathPoints && pathPoints.length > 0) {
            addSensorPaths(this.viewer, pathPoints, sensorName, color);
          }
        } catch (error) {
          console.error('获取传感器路径出错:', error);
        }
      }
    } catch (error) {
      console.error('处理节点选择过程中发生错误:', error);
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
    
    // 添加所有选中的节点
    for (const node of checkedNodes) {
      if (node.isLeaf && node.data) {
        const { name, noard_id, hex_color, sensorName } = node.data;
        const color = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
        
        if (node.isLeaf) { // 传感器节点
          // 获取并显示传感器路径
          const pathPoints = await fetchPathPoints(noard_id, sensorName);
          if (pathPoints && pathPoints.length > 0) {
            addSensorPaths(this.viewer, pathPoints, sensorName, color);
          }
        } else { // 卫星节点
          // 获取并显示轨道
          const trackPoints = await fetchTrackPoints(noard_id);
          if (trackPoints && trackPoints.length > 0) {
            const points = generatePositionsFromTrackPoints(trackPoints);
            addOrbitPath(this.viewer, points, name, color);
            addSatelliteEntity(this.viewer, trackPoints[0], name, color);
            
            // 更新时钟设置
            updateClockSettings(this.viewer, trackPoints);
          }
        }
      }
    }
  }
}