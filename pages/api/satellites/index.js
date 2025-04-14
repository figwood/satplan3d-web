import { getSession } from "next-auth/react"

export default async function handler(req, res) {
  const session = await getSession({ req })
  
  // 对于GET请求，允许未登录访问
  if (req.method !== 'GET' && !session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return res.status(500).json({ error: 'API_URL not configured' })
  }

  try {
    // 构建完整的 API URL，确保路径正确
    const fullUrl = `${apiUrl}/api/satellites`
    
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }

    // 添加认证 token
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`
    }

    const response = await fetch(fullUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API错误响应: ${errorText}`)
      throw new Error(`API返回错误: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // 对于 GET 请求，转换数据为树形结构
    if (req.method === 'GET') {
      if (!Array.isArray(data)) {
        return res.status(500).json({ 
          error: 'API返回了不正确的数据格式',
          expected: '数组',
          received: typeof data
        })
      }
      
      const transformData = (satellites) => {
        return {
          title: "卫星列表",
          key: "satellites-root",
          children: satellites.map(satellite => ({
            title: satellite.name,
            key: `satellite-${satellite.id}`,
            data: {
              ...satellite,
              hex_color: satellite.hex_color
            },
            children: satellite.sensors?.map(sensor => ({
              title: sensor.name,
              key: `satellite-${satellite.id}-sensor-${sensor.id}`,
              isLeaf: true,
              data: {
                id: satellite.id,
                noard_id: satellite.noard_id,
                name: satellite.name,
                satellite_hex_color: satellite.hex_color,
                sensorName: sensor.name,
                hex_color: sensor.hex_color
              }
            })) || []
          }))
        }
      }
      
      res.status(200).json(transformData(data))
    } else {
      // 对于其他请求，直接返回API响应
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