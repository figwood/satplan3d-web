export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      order_name,
      start_time,
      stop_time,
      hex_color,
      area,
      paths
    } = req.body;

    // 验证必需的字段
    if (!order_name || !start_time || !stop_time || !hex_color || !area || !paths) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['order_name', 'start_time', 'stop_time', 'hex_color', 'area', 'paths']
      });
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error('API_URL not configured');
    }

    // 调用后端服务的 API
    const response = await fetch(`${apiUrl}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_name,
        start_time,
        stop_time,
        hex_color,
        area,
        paths
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const savedOrder = await response.json();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}