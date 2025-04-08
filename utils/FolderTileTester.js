/**
 * Utility for testing different folder-based tile formats
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

// Test for TMS format (z/x/y.ext)
export async function testTmsFormat(basePath = '/tile/imagery') {
  console.log('Testing TMS tile format...');
  const results = { format: 'TMS', success: false, available: [] };
  
  // Test common tile coordinates
  const tiles = [
    { z: 0, x: 0, y: 0 },
    { z: 1, x: 0, y: 0 },
    { z: 1, x: 1, y: 0 },
    { z: 1, x: 0, y: 1 },
    { z: 1, x: 1, y: 1 }
  ];
  
  // Extensions to try
  const extensions = ['jpg', 'jpeg', 'png'];
  
  for (const ext of extensions) {
    const foundTiles = [];
    
    for (const tile of tiles) {
      const url = `${basePath}/${tile.z}/${tile.x}/${tile.y}.${ext}`;
      const exists = await fileExists(url);
      if (exists) {
        foundTiles.push(`${tile.z}/${tile.x}/${tile.y}`);
      }
    }
    
    if (foundTiles.length > 0) {
      results.success = true;
      results.extension = ext;
      results.available = foundTiles;
      results.url = `${basePath}/{z}/{x}/{y}.${ext}`;
      break;
    }
  }
  
  return results;
}

// Test for folder-only format (z/x.ext)
export async function testFolderXFormat(basePath = '/tile/imagery') {
  console.log('Testing Folder/X tile format...');
  const results = { format: 'Folder/X', success: false, available: [] };
  
  // Test common tile coordinates
  const tiles = [
    { z: 0, x: 0 },
    { z: 1, x: 0 },
    { z: 1, x: 1 },
    { z: 2, x: 0 }
  ];
  
  // Extensions to try
  const extensions = ['jpg', 'jpeg', 'png'];
  
  for (const ext of extensions) {
    const foundTiles = [];
    
    for (const tile of tiles) {
      const url = `${basePath}/${tile.z}/${tile.x}.${ext}`;
      const exists = await fileExists(url);
      if (exists) {
        foundTiles.push(`${tile.z}/${tile.x}`);
      }
    }
    
    if (foundTiles.length > 0) {
      results.success = true;
      results.extension = ext;
      results.available = foundTiles;
      results.url = `${basePath}/{z}/{x}.${ext}`;
      break;
    }
  }
  
  return results;
}

// Test all formats
export async function testAllFormats() {
  // Test TMS format first
  const tmsResults = await testTmsFormat();
  if (tmsResults.success) {
    console.log(`Found TMS format tiles with extension .${tmsResults.extension}`);
    console.log(`Available tiles: ${tmsResults.available.join(', ')}`);
    console.log(`Use URL template: ${tmsResults.url}`);
    return tmsResults;
  }
  
  // Test Folder/X format
  const folderXResults = await testFolderXFormat();
  if (folderXResults.success) {
    console.log(`Found Folder/X format tiles with extension .${folderXResults.extension}`);
    console.log(`Available tiles: ${folderXResults.available.join(', ')}`);
    console.log(`Use URL template: ${folderXResults.url}`);
    return folderXResults;
  }
  
  console.log('No supported folder structure found');
  return { success: false, message: 'No supported tile format found' };
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.folderTileTester = {
    fileExists,
    testTmsFormat,
    testFolderXFormat,
    testAllFormats
  };
}
