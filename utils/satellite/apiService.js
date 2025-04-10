/**
 * 卫星数据 API 服务
 */

/**
 * 获取卫星数据列表
 * @returns {Promise<Object>} 树形结构的卫星数据
 */
export const fetchSatelliteData = async () => {
  console.log('API Service: 开始获取卫星数据');
  try {
    const response = await fetch('/api/satellites');
    console.log('API Service: 卫星数据响应状态:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('API Service: 卫星数据获取成功, 卫星数量:', data.children ? data.children.length : 'unknown');
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
  console.warn('🚀 API Service: 强制调用轨道点数据, noard_id =', noard_id);
  const url = `/api/track-points?noard_id=${noard_id}`;
  console.warn('🚀 API Service: 轨道点请求URL =', url);
  
  try {
    const startTime = performance.now();
    console.warn('🚀 API Service: 开始发送轨道点请求...');
    
    // 使用 fetch 直接调用，避免可能的干扰
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const endTime = performance.now();
    
    console.warn(`🚀 API Service: 轨道点响应状态: ${response.status}, 请求耗时: ${(endTime-startTime).toFixed(2)}ms`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.warn('🚀 API Service: 轨道点数据获取成功, 点数:', data.length);
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
  console.log('API Service: 开始获取传感器路径点数据', { noard_id, sensor_name });
  const url = `/api/path-points?noard_id=${noard_id}&sensor_name=${sensor_name}`;
  console.log('API Service: 请求URL =', url);
  
  try {
    const startTime = performance.now();
    const response = await fetch(url);
    const endTime = performance.now();
    
    console.log(`API Service: 传感器路径响应状态: ${response.status}, 请求耗时: ${(endTime-startTime).toFixed(2)}ms`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Service: 传感器路径数据获取成功, 点数:', data.length);
    return data;
  } catch (error) {
    console.error('API Service: 获取传感器路径数据错误:', error);
    return null;
  }
};