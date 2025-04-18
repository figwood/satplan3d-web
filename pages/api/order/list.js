export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // TODO: Replace this with actual database query
    const orders = [
      {
        "order_name": "北京",
        "order_id": 3,
        "hex_color": "#FF0000"
      }
      // Add more orders as needed
    ];

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}