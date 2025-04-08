/**
 * Utility to detect and analyze local tile structures
 * This is a client-side tool to help identify how your tiles are organized
 */

// Function to test if a URL exists
export async function testImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Test multiple possible tile formats to help identify structure
export async function detectTileStructure() {
  console.log('Detecting tile structure...');
  
  // Base path to imagery tiles
  const basePath = '/tile/imagery';
  
  // Test formats
  const formats = ['jpg', 'jpeg', 'png'];
  
  // Test common structures
  const structures = [
    // Bing Maps quadkey format
    { name: 'Bing Quadkey', test: async (format) => {
      // Test a few common quadkeys at zoom level 1-3
      const quadkeys = ['0', '1', '2', '3', '03', '12']; 
      for (const key of quadkeys) {
        if (await testImageUrl(`${basePath}/${key}.${format}`)) {
          return { valid: true, path: `${basePath}/{quadkey}.${format}` };
        }
      }
      return { valid: false };
    }},
    
    // TMS format
    { name: 'TMS', test: async (format) => {
      // Test zoom/x/y pattern for a few common tiles
      const tests = [[0,0,0], [1,0,0], [1,1,0]];
      for (const [z, x, y] of tests) {
        if (await testImageUrl(`${basePath}/${z}/${x}/${y}.${format}`)) {
          return { valid: true, path: `${basePath}/{z}/{x}/{y}.${format}` };
        }
      }
      return { valid: false };
    }},
    
    // XYZ format
    { name: 'XYZ', test: async (format) => {
      const tests = [[0,0,0], [1,0,0], [1,1,1]];
      for (const [z, x, y] of tests) {
        if (await testImageUrl(`${basePath}/${z}/${x}/${y}.${format}`)) {
          return { valid: true, path: `${basePath}/{z}/{x}/{y}.${format}` };
        }
      }
      return { valid: false };
    }}
  ];
  
  // Results collection
  const results = [];
  
  // Test each structure with each format
  for (const structure of structures) {
    for (const format of formats) {
      console.log(`Testing ${structure.name} with ${format} format...`);
      const result = await structure.test(format);
      if (result.valid) {
        results.push({
          name: `${structure.name} (${format})`,
          path: result.path
        });
      }
    }
  }
  
  if (results.length > 0) {
    console.log('Detected the following tile structures:');
    results.forEach(r => console.log(`- ${r.name}: ${r.path}`));
  } else {
    console.log('No standard tile structure detected. You may need to use a custom provider.');
  }
  
  return results;
}

// Expose to window for browser console testing
if (typeof window !== 'undefined') {
  window.detectTileStructure = detectTileStructure;
}
