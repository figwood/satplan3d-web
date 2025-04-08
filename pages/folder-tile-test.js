import { useEffect, useState } from 'react';
import { testTmsFormat, testFolderXFormat, fileExists } from '../utils/FolderTileTester';

export default function FolderTileTest() {
  const [tmsResults, setTmsResults] = useState(null);
  const [folderXResults, setFolderXResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customPath, setCustomPath] = useState('/tile/imagery');
  const [customTest, setCustomTest] = useState('');
  const [customResult, setCustomResult] = useState(null);

  useEffect(() => {
    async function runTests() {
      try {
        const tms = await testTmsFormat();
        setTmsResults(tms);
        
        const folderX = await testFolderXFormat();
        setFolderXResults(folderX);
      } catch (error) {
        console.error('Error running tests:', error);
      } finally {
        setLoading(false);
      }
    }

    runTests();
  }, []);

  const handleCustomTest = async () => {
    if (!customTest) return;
    
    try {
      const url = `${customPath}/${customTest}`;
      const exists = await fileExists(url);
      setCustomResult({ url, exists });
    } catch (error) {
      setCustomResult({ error: error.message });
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Folder Structure Tile Tester</h1>
      
      <div style={{ marginBottom: 20 }}>
        <h2>Automatic Tests</h2>
        {loading ? (
          <p>Running tests...</p>
        ) : (
          <div>
            <h3>TMS Format (z/x/y.ext):</h3>
            <pre>{JSON.stringify(tmsResults, null, 2)}</pre>
            
            <h3>Folder/X Format (z/x.ext):</h3>
            <pre>{JSON.stringify(folderXResults, null, 2)}</pre>
            
            {tmsResults?.success && (
              <div>
                <h3>Sample TMS Images:</h3>
                {tmsResults.available.map((path) => (
                  <div key={path} style={{ marginBottom: 20 }}>
                    <h4>Path: {path}</h4>
                    <img 
                      src={`/tile/imagery/${path}.${tmsResults.extension}`} 
                      alt={`Tile ${path}`} 
                      style={{ border: '1px solid #ccc', maxWidth: '256px' }}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {folderXResults?.success && (
              <div>
                <h3>Sample Folder/X Images:</h3>
                {folderXResults.available.map((path) => (
                  <div key={path} style={{ marginBottom: 20 }}>
                    <h4>Path: {path}</h4>
                    <img 
                      src={`/tile/imagery/${path}.${folderXResults.extension}`} 
                      alt={`Tile ${path}`} 
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
        <h2>Custom Path Test</h2>
        <div>
          <label>Base Path: </label>
          <input 
            type="text" 
            value={customPath} 
            onChange={(e) => setCustomPath(e.target.value)} 
            style={{ width: 200, marginRight: 10 }}
          />
          <label>Test Path: </label>
          <input 
            type="text" 
            value={customTest} 
            placeholder="e.g., 0/0/0.jpg" 
            onChange={(e) => setCustomTest(e.target.value)} 
            style={{ width: 200, marginRight: 10 }}
          />
          <button onClick={handleCustomTest}>Test</button>
        </div>
        
        {customResult && (
          <div style={{ marginTop: 20 }}>
            <h3>Result:</h3>
            <pre>{JSON.stringify(customResult, null, 2)}</pre>
            {customResult.exists && (
              <div>
                <h4>Image:</h4>
                <img 
                  src={customResult.url} 
                  alt="Custom path tile"
                  style={{ border: '1px solid #ccc', maxWidth: '256px' }} 
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 30 }}>
        <h2>Recommendations</h2>
        {!loading && (
          <div>
            {tmsResults?.success && (
              <div style={{ padding: 10, backgroundColor: '#eaffea', border: '1px solid #afa', marginBottom: 10 }}>
                <h3>✅ Use TMS Format Provider:</h3>
                <pre style={{ backgroundColor: '#f8f8f8', padding: 10 }}>
{`const imageryProvider = new Cesium.UrlTemplateImageryProvider({
  url: '${tmsResults.url}',
  tilingScheme: new Cesium.WebMercatorTilingScheme(),
  maximumLevel: 5
});`}
                </pre>
              </div>
            )}
            
            {folderXResults?.success && (
              <div style={{ padding: 10, backgroundColor: '#eaffea', border: '1px solid #afa' }}>
                <h3>✅ Use Folder/X Format Provider:</h3>
                <pre style={{ backgroundColor: '#f8f8f8', padding: 10 }}>
{`const imageryProvider = new Cesium.UrlTemplateImageryProvider({
  url: '${folderXResults.url}',
  tilingScheme: new Cesium.WebMercatorTilingScheme(),
  maximumLevel: 5
});`}
                </pre>
              </div>
            )}
            
            {!tmsResults?.success && !folderXResults?.success && (
              <div style={{ padding: 10, backgroundColor: '#ffeeee', border: '1px solid #faa' }}>
                <h3>❌ No Standard Format Detected</h3>
                <p>Use the custom path tester to determine your tile structure.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
