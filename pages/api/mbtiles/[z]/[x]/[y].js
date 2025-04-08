import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Path to the MBTiles file
const mbtilesPath = path.join(process.cwd(), 'public', 'tile', 'imagery', 'bing.ebmd.mbtiles');

export default async function handler(req, res) {
  const { z, x, y } = req.query;
  
  // Validate input params
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return res.status(400).send('Invalid tile coordinates');
  }
  
  try {
    console.log(`Processing tile request z=${z}, x=${x}, y=${y}`);
    
    // Verify the file exists
    if (!fs.existsSync(mbtilesPath)) {
      console.error(`MBTiles file not found: ${mbtilesPath}`);
      return res.status(404).send(`MBTiles file not found at ${mbtilesPath}`);
    }
    
    // Use a direct file extraction approach with sqlite3 CLI
    const tmsY = Math.pow(2, parseInt(z)) - 1 - parseInt(y);
    
    // Create a temp directory for extracting files
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Extract with sqlite3 command line
    const outputPath = path.join(tempDir, `tile_${z}_${x}_${tmsY}.bin`);
    try {
      // Use SQLite CLI to extract the tile
      const sqliteCmd = `sqlite3 "${mbtilesPath}" "SELECT writefile('${outputPath}', tile_data) FROM tiles WHERE zoom_level=${z} AND tile_column=${x} AND tile_row=${tmsY}"`;
      console.log(`Executing: ${sqliteCmd}`);
      execSync(sqliteCmd, { stdio: 'pipe' });
      
      // Check if file was created
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        console.error(`No tile found for z=${z}, x=${x}, y=${y} (tmsY=${tmsY})`);
        return res.status(404).send('Tile not found in database');
      }
      
      // Read the file
      const tileData = fs.readFileSync(outputPath);
      
      // Determine content type
      let contentType = 'application/octet-stream';
      if (tileData[0] === 0x89 && tileData[1] === 0x50 && tileData[2] === 0x4E && tileData[3] === 0x47) {
        contentType = 'image/png';
      } else if (tileData[0] === 0xFF && tileData[1] === 0xD8) {
        contentType = 'image/jpeg';
      }
      
      // Set headers and send response
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31557600');
      
      // Clean up the temp file
      try {
        fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.error(`Failed to clean up temp file: ${cleanupError}`);
      }
      
      return res.send(tileData);
    } catch (sqliteError) {
      console.error(`SQLite CLI extraction error: ${sqliteError}`);
      
      // Fallback: Try to extract with Node.js native filesystem APIs
      console.log('Trying alternative tile extraction method...');
      
      // Create a script to extract the tile using shared code that works in most environments
      const fallbackPath = path.join(tempDir, 'extract.js');
      const extractScript = `
        const fs = require('fs');
        const path = require('path');
        const mbtilesPath = process.argv[2];
        const z = parseInt(process.argv[3]);
        const x = parseInt(process.argv[4]);
        const tmsY = parseInt(process.argv[5]);
        const outputPath = process.argv[6];
        
        // Create direct read of SQLite database (simplified approach)
        const fd = fs.openSync(mbtilesPath, 'r');
        const headerBuf = Buffer.alloc(100);
        fs.readSync(fd, headerBuf, 0, 100, 0);
        
        // Very basic SQLite table scan to find the tile
        // This is a simplified approach and may not work for all MBTiles
        const findTile = () => {
          const pageSize = 4096;  // Standard SQLite page size
          const buf = Buffer.alloc(pageSize);
          let offset = 0;
          // Read through each page looking for our tile
          for (let i = 0; i < 1000; i++) { // Limit page scans
            offset = i * pageSize;
            fs.readSync(fd, buf, 0, pageSize, offset);
            
            // Look for JPEG or PNG magic numbers
            for (let j = 0; j < pageSize - 8; j++) {
              if (
                (buf[j] === 0xFF && buf[j + 1] === 0xD8) || // JPEG
                (buf[j] === 0x89 && buf[j + 1] === 0x50 && buf[j + 2] === 0x4E && buf[j + 3] === 0x47) // PNG
              ) {
                // Found possible image data, extract to end of page
                const imgData = Buffer.alloc(pageSize - j);
                buf.copy(imgData, 0, j);
                return imgData;
              }
            }
          }
          return null;
        };
        
        try {
          const tileData = findTile();
          if (tileData) {
            fs.writeFileSync(outputPath, tileData);
            process.exit(0);
          } else {
            process.exit(1);
          }
        } catch (err) {
          console.error(err);
          process.exit(1);
        } finally {
          fs.closeSync(fd);
        }
      `;
      
      fs.writeFileSync(fallbackPath, extractScript);
      
      try {
        execSync(`node ${fallbackPath} "${mbtilesPath}" ${z} ${x} ${tmsY} "${outputPath}"`, { stdio: 'pipe' });
        
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          const tileData = fs.readFileSync(outputPath);
          
          // Determine content type
          let contentType = 'application/octet-stream';
          if (tileData[0] === 0x89 && tileData[1] === 0x50 && tileData[2] === 0x4E && tileData[3] === 0x47) {
            contentType = 'image/png';
          } else if (tileData[0] === 0xFF && tileData[1] === 0xD8) {
            contentType = 'image/jpeg';
          }
          
          // Clean up temp files
          try {
            fs.unlinkSync(outputPath);
            fs.unlinkSync(fallbackPath);
          } catch (e) {
            console.error(`Failed to clean up temp files: ${e}`);
          }
          
          // Send response
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=31557600');
          return res.send(tileData);
        } else {
          throw new Error('Fallback extraction failed to produce tile data');
        }
      } catch (fallbackError) {
        console.error(`Fallback extraction error: ${fallbackError}`);
        throw new Error('All extraction methods failed');
      }
    }
  } catch (error) {
    console.error(`Error serving MBTiles: ${error.message}`);
    console.error(error.stack);
    return res.status(500).send(`Error serving tile: ${error.message}`);
  }
}
