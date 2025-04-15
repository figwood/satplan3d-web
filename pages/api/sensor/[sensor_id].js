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

  const { sensor_id } = req.query;

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!session.access_token) {
      console.error('会话中没有访问令牌');
      return res.status(401).json({ error: 'No access token available' })
    }

    const {
      sensor_name,
      resolution,
      right_side_angle,
      left_side_angle,
      init_angle,
      observe_angle,
      hex_color
    } = req.body;

    // 验证必填字段
    if (!sensor_name || !resolution || right_side_angle === undefined || 
        left_side_angle === undefined || init_angle === undefined || observe_angle === undefined) {
      return res.status(400).json({
        error: '缺少必要参数',
        required: [
          'sensor_name',
          'resolution',
          'right_side_angle',
          'left_side_angle',
          'init_angle',
          'observe_angle'
        ]
      });
    }

    const response = await fetch(`${apiUrl}/api/sensor/${sensor_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
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
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error updating sensor:', error);
    return res.status(500).json({ error: '更新载荷失败' });
  }
}