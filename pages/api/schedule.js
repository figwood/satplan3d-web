export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { 
      noard_id, 
      sensor_id,  // 确保接收 sensor_id
      sensor_name, 
      start_time, 
      stop_time, 
      area 
    } = req.body;

    // Validate required fields
    if (!noard_id || !sensor_id || !sensor_name || !start_time || !stop_time || !area) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        required: ['noard_id', 'sensor_id', 'sensor_name', 'start_time', 'stop_time', 'area']
      });
    }

    // Validate area object
    if (!area.x_min || !area.y_min || !area.x_max || !area.y_max) {
      return res.status(400).json({ 
        error: '区域参数格式不正确',
        required: ['x_min', 'y_min', 'x_max', 'y_max']
      });
    }

    // Validate timestamp format
    if (typeof start_time !== 'number' || typeof stop_time !== 'number') {
      return res.status(400).json({ 
        error: '时间参数必须为时间戳(timestamp)格式'
      });
    }

    // Forward the request to your backend API
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error('API_URL not configured');
    }

    const response = await fetch(`${apiUrl}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        noard_id,
        sensor_id,     // 确保传递 sensor_id
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
    // 在响应中添加传感器信息
    const enrichedData = {
      ...data,
      noard_id,
      sensor_id,
      sensor_name
    };
    res.status(200).json(enrichedData);
  } catch (error) {
    console.error('调度任务处理错误:', error);
    res.status(500).json({ error: error.message || '调度任务失败' });
  }
}