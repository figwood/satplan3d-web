import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  // 卫星列表接口不需要认证即可访问
  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return res.status(500).json({ error: 'API_URL not configured' })
  }

  try {
    // 构建完整的 API URL
    const fullUrl = `${apiUrl}/api/satellite/list`
    
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }

    const response = await fetch(fullUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API错误响应状态: ${response.status}`);
      console.error(`API错误响应内容: ${errorText}`);
      throw new Error(`API返回错误: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (req.method === 'GET' && !Array.isArray(data)) {
      return res.status(500).json({ 
        error: 'API返回了不正确的数据格式',
        expected: '数组',
        received: typeof data
      })
    }
    
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