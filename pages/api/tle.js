import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return res.status(500).json({ error: 'API_URL not configured' })
  }
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    if (!session.access_token) {
      console.error('会话中没有访问令牌');
      return res.status(401).json({ error: 'No access token available' })
    }

    const { tle } = req.body;
    if (!tle) {
      return res.status(400).json({ error: 'TLE data is required' });
    }

    // 从 TLE 数据中解析 NORAD ID
    const lines = tle.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'Invalid TLE data format' });
    }

    const response = await fetch(`${apiUrl}/api/tle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({tle_data: tle })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`更新TLE失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating TLE:', error);
    res.status(500).json({ error: error.message || 'Failed to update TLE' });
  }
}