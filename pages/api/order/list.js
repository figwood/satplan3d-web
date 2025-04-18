export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error('API_URL not configured');
    }

    const response = await fetch(`${apiUrl}/api/order/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const orders = await response.json();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}