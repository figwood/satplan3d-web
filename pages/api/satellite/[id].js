import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

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
  
  try {
    // 确保令牌存在
    if (!session.access_token) {
      console.error('会话中没有访问令牌');
      return res.status(401).json({ error: 'No access token available' })
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }

    // 处理 PUT 和 DELETE 请求
    if (!['PUT', 'DELETE'].includes(req.method)) {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    
    // 如果是 PUT 请求，修改请求体，将 name 转换为 sat_name
    let modifiedBody = req.body;
    if (req.method === 'PUT' && req.body) {
      modifiedBody = { ...req.body };
      if (modifiedBody.name) {
        modifiedBody.sat_name = modifiedBody.name;
        delete modifiedBody.name;
      }
    }
    
    const response = await fetch(`${apiUrl}/api/satellite/${id}`, {
      method: req.method,
      headers,
      body: req.method === 'PUT' ? JSON.stringify(modifiedBody) : undefined,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API错误响应状态: ${response.status}`);
      console.error(`API错误响应内容: ${errorText}`);
      throw new Error(`API返回错误: ${response.status} - ${errorText}`)
    }
    
    if (req.method === 'DELETE') {
      // DELETE 请求通常不返回内容
      res.status(204).end()
    } else {
      const data = await response.json()
      res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('处理卫星请求错误:', error)
    res.status(500).json({ 
      error: '处理请求失败',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}