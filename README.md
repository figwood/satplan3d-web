# Satellite Orbit Visualization

This Next.js web application visualizes satellite orbits in 3D using CesiumJS.

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Get a Cesium ion access token from [https://cesium.com/ion/](https://cesium.com/ion/)

3. Update the access token in `components/SatelliteViewer.js`

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- 3D visualization of satellite orbits
- Add random satellites with realistic orbital parameters
- Clear all satellites
- Time-dynamic visualization with animation controls
- React-based interactive UI

## File Structure

- `pages/index.js` - Main page
- `pages/_app.js` - Custom App component
- `pages/_document.js` - Custom Document for head customization
- `components/SatelliteViewer.js` - Cesium viewer component
- `utils/satellite.js` - Satellite class for orbit calculations
- `styles/globals.css` - Global styling
- `next.config.js` - Next.js configuration for Cesium

## Future Enhancements

- Import TLE (Two-Line Element) data for real satellites
- Custom satellite parameters input
- Multiple visualization styles
- Ground station visibility analysis
- API integration for live satellite data
- Interactive orbit design tools
