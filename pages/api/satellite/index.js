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
  
  try {
    // 确保令牌存在
    if (!session.access_token) {
      console.error('会话中没有访问令牌');
      return res.status(401).json({ error: 'No access token available' })
    }
    
    console.log('令牌信息:', {
      hasToken: !!session.access_token,
      tokenType: session.token_type
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `${session.token_type} ${session.access_token}`
    }
    
    // 只处理 POST 请求 - 创建新卫星
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    
    // 修改请求体，将name转换为sat_name
    let modifiedBody = { ...req.body };
    if (modifiedBody.name) {
      modifiedBody.sat_name = modifiedBody.name;
      delete modifiedBody.name;
    }
    
    // 打印请求信息
    const requestUrl = `${apiUrl}/api/satellite`;
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(modifiedBody),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API错误响应状态: ${response.status}`);
      console.error(`API错误响应内容: ${errorText}`);
      throw new Error(`API返回错误: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('处理卫星请求错误:', error)
    res.status(500).json({ 
      error: '处理请求失败',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}