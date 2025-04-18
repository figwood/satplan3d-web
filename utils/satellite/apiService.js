/**
 * 卫星数据 API 服务
 */

/**
 * 获取 Cesium 对象
 * 这样可以确保只在需要时获取 Cesium，并且不会在服务器端渲染时出错
 * @returns {Object} Cesium 对象
 */
const getCesium = () => {
  if (typeof window !== 'undefined') {
    return window.Cesium;
  }
  return null;
};

/**
 * 获取卫星数据列表
 * @returns {Promise<Object>} 包含卫星和观测规划数据的对象
 */
export const fetchSatelliteData = async () => {
  try {
    const [satellitesResponse, ordersResponse] = await Promise.all([
      fetch('/api/satellite/list', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }),
      fetch('/api/order/list', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
    ]);
    
    if (!satellitesResponse.ok) {
      throw new Error(`获取卫星数据失败: HTTP ${satellitesResponse.status}`);
    }
    if (!ordersResponse.ok) {
      throw new Error(`获取观测规划数据失败: HTTP ${ordersResponse.status}`);
    }
    
    const [satellites, orders] = await Promise.all([
      satellitesResponse.json(),
      ordersResponse.json()
    ]);

    return {
      satellites,
      orders
    };
  } catch (error) {
    console.error('API Service: 获取数据错误:', error);
    return {
      satellites: [],
      orders: []
    };
  }
};

/**
 * 获取卫星轨道点数据
 * @param {string} noard_id 卫星ID
 * @returns {Promise<Array>} 轨道点数据数组
 */
export const fetchTrackPoints = async (noard_id) => {
  // 强制输出日志，确保每次调用都有记录
  const url = `/api/track-points?noard_id=${noard_id}`;
  
  try {
    const startTime = performance.now();
    
    // 使用 fetch 直接调用，避免可能的干扰
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const endTime = performance.now();
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Service: 获取轨道点数据错误:', error);
    return null;
  }
};

/**
 * 获取传感器路径点数据
 * @param {string} noard_id 卫星ID
 * @param {string} sensor_name 传感器名称
 * @returns {Promise<Array>} 路径点数据数组
 */
export const fetchPathPoints = async (noard_id, sensor_name) => {
  const url = `/api/path-points?noard_id=${noard_id}&sensor_name=${sensor_name}`;
  
  try {
    const startTime = performance.now();
    const response = await fetch(url);
    const endTime = performance.now();
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Service: 获取传感器路径数据错误:', error);
    return null;
  }
};

/**
 * 提交卫星调度任务
 * @param {string} noard_id 卫星ID
 * @param {string} sensor_id 传感器ID
 * @param {string} sensor_name 传感器名称
 * @param {number} start_time 开始时间 (UTC 时间戳，秒)
 * @param {number} stop_time 结束时间 (UTC 时间戳，秒)
 * @param {Object} area 区域坐标 {x_min, y_min, x_max, y_max}
 * @returns {Promise<Object>} 调度结果
 */
export const scheduleTask = async (noard_id, sensor_id, sensor_name, start_time, stop_time, area) => {
  try {
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        noard_id,
        sensor_id,   // 确保传递 sensor_id
        sensor_name,
        start_time,
        stop_time,
        area
      }),
    });
    
    if (!response.ok) {
      throw new Error(`调度请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Service: 提交调度任务失败:', error);
    throw error;
  }
};

/**
 * 处理调度结果并显示多边形
 * @param {Object} scheduleResult 调度结果
 * @param {Object} viewer Cesium viewer实例
 * @param {Object} options 可选项 {fillColor, outlineColor, outlineWidth, fillAlpha}
 * @returns {Array} 创建的实体数组
 */
export const displayScheduleResults = (scheduleResult, viewer, options = {}) => {
  try {
    // 确保 Cesium 已加载
    const Cesium = getCesium();
    if (!Cesium) {
      console.error('Cesium 未加载');
      return [];
    }
    
    if (!scheduleResult || !scheduleResult.opportunities || !Array.isArray(scheduleResult.opportunities)) {
      console.warn('无效的调度结果数据');
      return [];
    }

    // 默认值
    const defaultOptions = {
      fillColor: Cesium.Color.GREEN,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      fillAlpha: 0.3
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const fillColor = mergedOptions.fillColor.withAlpha(mergedOptions.fillAlpha);
    
    // 存储创建的实体以便后续引用
    const createdEntities = [];
    const opportunities = scheduleResult.opportunities;

    opportunities.forEach((opportunity, index) => {
      if (!opportunity.polygon || !Array.isArray(opportunity.polygon)) {
        console.warn(`机会 ${index} 缺少有效的多边形数据`);
        return;
      }
      
      // 从多边形坐标中提取经纬度
      const positions = opportunity.polygon.map(coord => 
        Cesium.Cartesian3.fromDegrees(coord.lon, coord.lat)
      );

      // 确保多边形闭合
      if (positions.length > 0 && 
          (positions[0].x !== positions[positions.length - 1].x || 
           positions[0].y !== positions[positions.length - 1].y)) {
        positions.push(positions[0]);
      }

      // 创建时间戳
      const startTime = new Date(opportunity.start_time * 1000);
      const endTime = new Date(opportunity.end_time * 1000);
      
      try {
        // 创建多边形实体
        const entity = viewer.entities.add({
          name: `观测机会 ${index + 1} (${startTime.toLocaleString()} - ${endTime.toLocaleString()})`,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(positions),
            material: fillColor,
            outline: true,
            outlineColor: mergedOptions.outlineColor,
            outlineWidth: mergedOptions.outlineWidth,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          },
          description: `
            <p>开始时间: ${startTime.toLocaleString()}</p>
            <p>结束时间: ${endTime.toLocaleString()}</p>
            <p>持续时间: ${(opportunity.end_time - opportunity.start_time)} 秒</p>
            <p>卫星: ${scheduleResult.noard_id || 'N/A'}</p>
            <p>传感器: ${scheduleResult.sensor_name || 'N/A'}</p>
            <p>传感器ID: ${scheduleResult.sensor_id || 'N/A'}</p>
          `
        });
        
        createdEntities.push(entity);
      } catch (entityError) {
        console.error(`创建实体失败:`, entityError);
      }
    });

    return createdEntities;
  } catch (error) {
    console.error('显示调度结果错误:', error);
    return [];
  }
};