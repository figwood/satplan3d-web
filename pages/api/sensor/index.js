import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return res.status(500).json({ error: 'API_URL not configured' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!session.access_token) {
      console.error('会话中没有访问令牌');
      return res.status(401).json({ error: 'No access token available' })
    }

    const {
      noard_id,
      sensor_name,
      resolution,
      right_side_angle,
      left_side_angle,
      init_angle,
      observe_angle,
      hex_color
    } = req.body;

    // 验证必填字段
    if (!noard_id || !sensor_name || !resolution || right_side_angle === undefined || 
        left_side_angle === undefined || init_angle === undefined || observe_angle === undefined) {
      return res.status(400).json({
        error: '缺少必要参数',
        required: [
          'noard_id',
          'sensor_name',
          'resolution',
          'right_side_angle',
          'left_side_angle',
          'init_angle',
          'observe_angle'
        ]
      });
    }

    const response = await fetch(`${apiUrl}/api/sensor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        noard_id,
        sensor_name,
        resolution,
        right_side_angle,
        left_side_angle,
        init_angle,
        observe_angle,
        hex_color: hex_color || '#3388ff'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(201).json(data);

  } catch (error) {
    console.error('Error creating sensor:', error);
    return res.status(500).json({ error: '创建载荷失败' });
  }
}