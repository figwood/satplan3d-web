export default async function handler(req, res) {
  try {
    const response = await fetch(`${process.env.API_URL}/satellites`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // 转换数据结构为树形结构
    const transformData = (satellites) => {
      return {
        name: "Satellites",
        checked: false,
        children: satellites.map(satellite => ({
          name: satellite.name,
          id: satellite.id,
          noard_id: satellite.noard_id,
          hex_color: satellite.hex_color,
          checked: false,
          children: satellite.sensors.map(sensor => ({
            name: sensor.name,
            id: sensor.id,
            hex_color: sensor.hex_color,
            resolution: sensor.resolution,
            width: sensor.width,
            observe_angle: sensor.observe_angle,
            init_angle: sensor.init_angle,
            checked: false
          }))
        }))
      };
    };

    const transformedData = transformData(data);
    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching satellite data:', error);
    res.status(500).json({ error: 'Failed to fetch satellite data' });
  }
}