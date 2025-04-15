export default async function handler(req, res) {
  try {
    const { noard_id } = req.query;
    
    if (!noard_id) {
      res.status(400).json({ error: 'Missing noard_id parameter' });
      return;
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error('API_URL not configured');
    }

    const response = await fetch(`${apiUrl}/api/track-points?noard_id=${noard_id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch track points: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching track points:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch track points' });
  }
}