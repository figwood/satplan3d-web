import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export default async function handler(req, res) {
  try {
    const mbtilesPath = path.join(process.cwd(), 'public', 'tile', 'imagery', 'bing.ebmd.mbtiles');
    
    if (!fs.existsSync(mbtilesPath)) {
      return res.status(404).json({ error: `MBTiles file not found: ${mbtilesPath}` });
    }
    
    // Get file stats
    const stats = fs.statSync(mbtilesPath);
    
    // Try to get metadata using sqlite3 CLI
    let metadata = {};
    try {
      const metadataCmd = `sqlite3 "${mbtilesPath}" "SELECT name, value FROM metadata"`;
      const metadataOutput = execSync(metadataCmd, { encoding: 'utf8', stdio: 'pipe' });
      
      const metadataLines = metadataOutput.split('\n').filter(line => line.trim());
      metadata = metadataLines.reduce((acc, line) => {
        const parts = line.split('|');
        if (parts.length === 2) {
          acc[parts[0]] = parts[1];
        }
        return acc;
      }, {});
    } catch (error) {
      metadata = { error: `Could not extract metadata: ${error.message}` };
    }
    
    // Try to get tile count information
    let tileInfo = {};
    try {
      const tileCountCmd = `sqlite3 "${mbtilesPath}" "SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level"`;
      const tileCountOutput = execSync(tileCountCmd, { encoding: 'utf8', stdio: 'pipe' });
      
      const tileCountLines = tileCountOutput.split('\n').filter(line => line.trim());
      const zoomLevels = {};
      
      tileCountLines.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 2) {
          zoomLevels[parts[0]] = parseInt(parts[1], 10);
        }
      });
      
      tileInfo = { zoomLevels };
    } catch (error) {
      tileInfo = { error: `Could not extract tile info: ${error.message}` };
    }
    
    return res.status(200).json({
      file: {
        path: mbtilesPath,
        size: stats.size,
        sizeInMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
        created: stats.birthtime,
        modified: stats.mtime,
      },
      metadata,
      tileInfo,
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
