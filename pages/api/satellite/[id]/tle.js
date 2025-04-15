import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const { id } = req.query
  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return res.status(500).json({ error: 'API_URL not configured' })
  }
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // 确保令牌存在
    if (!session.access_token) {
      console.error('会话中没有访问令牌');
      return res.status(401).json({ error: 'No access token available' })
    }

    const response = await fetch(`${apiUrl}/api/satellite/${id}/tle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TLE更新失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating TLE:', error)
    res.status(500).json({ error: error.message || 'Failed to update TLE' })
  }
}