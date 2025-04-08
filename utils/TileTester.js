/**
 * Utility for testing if tile files exist at expected paths
 */

// Test if a specific file exists
export async function fileExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking file ${url}:`, error);
    return false;
  }
}

// Test Bing Maps quadkey format
export async function testBingTiles(basePath = '/tile/imagery') {
  console.log('Testing Bing Maps tile format...');
  const results = { format: 'Bing Maps (quadkey)', success: false, available: [] };
  
  // Test common quadkeys for zoom levels 0-3
  const quadkeys = [
    '0', // Root tile (zoom level 1)
    '1', '2', '3', // Zoom level 1
    '00', '01', '02', '03', '10', '11', '12', '13', '20', '21', '22', '23', '30', '31', '32', '33', // Zoom level 2
  ];
  
  // Extensions to try
  const extensions = ['jpg', 'jpeg', 'png'];
  
  // Test each combination
  for (const ext of extensions) {
    let found = 0;
    const foundQuadkeys = [];
    
    for (const quadkey of quadkeys) {
      const url = `${basePath}/${quadkey}.${ext}`;
      const exists = await fileExists(url);
      if (exists) {
        found++;
        foundQuadkeys.push(quadkey);
      }
    }
    
    if (found > 0) {
      results.success = true;
      results.extension = ext;
      results.available = foundQuadkeys;
      results.url = `${basePath}/{quadkey}.${ext}`;
      break;
    }
  }
  
  return results;
}

// Test if any tiles exist in the directory
export async function testAllFormats() {
  const bingResults = await testBingTiles();
  
  if (bingResults.success) {
    console.log(`Found Bing Maps tiles with extension .${bingResults.extension}`);
    console.log(`Available tiles: ${bingResults.available.join(', ')}`);
    console.log(`Use URL template: ${bingResults.url}`);
    return bingResults;
  } else {
    console.log('No Bing Maps tiles found in the expected format');
    return { success: false, message: 'No supported tile format found' };
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testTiles = {
    fileExists,
    testBingTiles,
    testAllFormats
  };
}
