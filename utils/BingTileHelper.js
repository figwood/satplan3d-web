/**
 * Utility functions for working with Bing Maps tile format
 */

/**
 * Converts tile XY coordinates to a quadkey
 * @param {number} x - X coordinate of the tile
 * @param {number} y - Y coordinate of the tile
 * @param {number} level - Zoom level
 * @returns {string} Quadkey for the specified tile
 */
export function tileXYToQuadKey(x, y, level) {
  let quadkey = '';
  for (let i = level; i > 0; i--) {
    let digit = '0';
    const mask = 1 << (i - 1);
    if ((x & mask) !== 0) {
      digit++;
    }
    if ((y & mask) !== 0) {
      digit++;
      digit++;
    }
    quadkey += digit;
  }
  return quadkey;
}

/**
 * Converts a quadkey to tile XY coordinates
 * @param {string} quadkey - Quadkey to convert
 * @returns {Object} Object containing x, y, and level
 */
export function quadKeyToTileXY(quadkey) {
  let x = 0;
  let y = 0;
  const level = quadkey.length;
  
  for (let i = level; i > 0; i--) {
    const mask = 1 << (i - 1);
    switch (quadkey[level - i]) {
      case '0':
        break;
      case '1':
        x |= mask;
        break;
      case '2':
        y |= mask;
        break;
      case '3':
        x |= mask;
        y |= mask;
        break;
      default:
        throw new Error('Invalid QuadKey digit sequence.');
    }
  }
  
  return {
    x,
    y,
    level
  };
}
