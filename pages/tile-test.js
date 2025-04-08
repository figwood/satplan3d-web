import { useEffect, useState } from 'react';
import { testBingTiles, fileExists } from '../utils/TileTester';
import { tileXYToQuadKey } from '../utils/BingTileHelper';

export default function TileTest() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualTest, setManualTest] = useState({ x: 0, y: 0, z: 0 });
  const [manualResult, setManualResult] = useState(null);
  const [extension, setExtension] = useState('jpg');

  useEffect(() => {
    async function runTests() {
      try {
        const results = await testBingTiles();
        setTestResults(results);
      } catch (error) {
        console.error('Error running tests:', error);
        setTestResults({ error: error.message });
      } finally {
        setLoading(false);
      }
    }

    runTests();
  }, []);

  const handleManualTest = async () => {
    try {
      const { x, y, z } = manualTest;
      const quadkey = tileXYToQuadKey(parseInt(x), parseInt(y), parseInt(z));
      const url = `/tile/imagery/${quadkey}.${extension}`;
      const exists = await fileExists(url);
      setManualResult({
        quadkey,
        url,
        exists
      });
    } catch (error) {
      setManualResult({ error: error.message });
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Satellite Tile Tester</h1>
      
      <div style={{ marginBottom: 20 }}>
        <h2>Automatic Tests</h2>
        {loading ? (
          <p>Running tests...</p>
        ) : (
          <div>
            <h3>Bing Maps (Quadkey) Format:</h3>
            <pre>{JSON.stringify(testResults, null, 2)}</pre>
            
            {testResults?.success && (
              <div>
                <h3>Test Images:</h3>
                {testResults.available.map((quadkey) => (
                  <div key={quadkey} style={{ marginBottom: 20 }}>
                    <h4>Quadkey: {quadkey}</h4>
                    <img 
                      src={`/tile/imagery/${quadkey}.${testResults.extension}`} 
                      alt={`Tile ${quadkey}`} 
                      style={{ border: '1px solid #ccc', maxWidth: '256px' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 30 }}>
        <h2>Manual Tile Test</h2>
        <div>
          <label>X: </label>
          <input 
            type="number" 
            value={manualTest.x} 
            onChange={(e) => setManualTest({...manualTest, x: e.target.value})} 
            style={{ width: 60, marginRight: 10 }}
          />
          <label>Y: </label>
          <input 
            type="number" 
            value={manualTest.y} 
            onChange={(e) => setManualTest({...manualTest, y: e.target.value})} 
            style={{ width: 60, marginRight: 10 }}
          />
          <label>Z (level): </label>
          <input 
            type="number" 
            value={manualTest.z}
            onChange={(e) => setManualTest({...manualTest, z: e.target.value})} 
            style={{ width: 60, marginRight: 10 }}
          />
          <label>Extension: </label>
          <select 
            value={extension} 
            onChange={(e) => setExtension(e.target.value)}
            style={{ marginRight: 10 }}
          >
            <option value="jpg">jpg</option>
            <option value="jpeg">jpeg</option>
            <option value="png">png</option>
          </select>
          <button onClick={handleManualTest}>Test</button>
        </div>
        
        {manualResult && (
          <div style={{ marginTop: 20 }}>
            <h3>Result:</h3>
            <pre>{JSON.stringify(manualResult, null, 2)}</pre>
            {manualResult.exists && (
              <div>
                <h4>Image:</h4>
                <img 
                  src={manualResult.url} 
                  alt={`Tile ${manualResult.quadkey}`}
                  style={{ border: '1px solid #ccc', maxWidth: '256px' }} 
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 30 }}>
        <h2>Common Issues</h2>
        <ul>
          <li><strong>File not found:</strong> Make sure your tile files are in the correct location (/public/tile/imagery/)</li>
          <li><strong>Wrong format:</strong> Confirm the file extension (.jpg, .png, etc.)</li>
          <li><strong>Wrong naming:</strong> Bing maps tiles should be named with quadkeys (0.jpg, 1.jpg, etc.)</li>
          <li><strong>CORS issues:</strong> Check browser console for CORS errors</li>
          <li><strong>Tile structure:</strong> Verify your tiles follow the Bing Maps format</li>
        </ul>
      </div>
    </div>
  );
}
