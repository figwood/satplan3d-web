export default async function handler(req, res) {
  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error('API_URL not configured');
    }

    const response = await fetch(`${apiUrl}/satellites`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const data = await response.json();

    // 转换数据结构为树形结构
    const transformData = (satellites) => {
      return {
        title: "卫星列表",
        key: "satellites-root",
        children: satellites.map(satellite => ({
          title: satellite.name,
          key: `satellite-${satellite.id}`,
          children: satellite.sensors.map(sensor => ({
            title: sensor.name,
            key: `satellite-${satellite.id}-sensor-${sensor.id}`,
            isLeaf: true,
            data: {
              ...satellite,
              sensorName: sensor.name,
              hex_color: sensor.hex_color
            }
          }))
        }))
      };
    };

    const transformedData = transformData(data);
    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error processing satellite data:', error);
    res.status(500).json({ error: error.message || 'Failed to process satellite data' });
  }
}