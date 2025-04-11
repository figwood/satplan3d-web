/**
 * 卫星数据 API 服务
 */

/**
 * 获取卫星数据列表
 * @returns {Promise<Object>} 树形结构的卫星数据
 */
export const fetchSatelliteData = async () => {
  try {
    const response = await fetch('/api/satellites');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Service: 获取卫星数据错误:', error);
    throw error;
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