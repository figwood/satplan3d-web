import { getSession } from "next-auth/react"

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return res.status(500).json({ error: 'API_URL not configured' })
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`
    }

    const response = await fetch(`${apiUrl}/satellites/${id}`, {
      method: req.method,
      headers,
      body: ['PUT', 'POST'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    if (req.method === 'DELETE') {
      res.status(204).end()
    } else {
      const data = await response.json()
      res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('Error handling satellite request:', error)
    res.status(500).json({ error: 'Failed to process request' })
  }
}