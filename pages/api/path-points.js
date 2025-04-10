export default async function handler(req, res) {
  try {
    const { noard_id, sensor_name } = req.query;
    
    if (!noard_id || !sensor_name) {
      res.status(400).json({ error: 'Missing required parameters: noard_id and sensor_name are required' });
      return;
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error('API_URL not configured');
    }

    const response = await fetch(`${apiUrl}/path-points?noard_id=${noard_id}&sensor_name=${sensor_name}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch path points: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching path points:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch path points' });
  }
}