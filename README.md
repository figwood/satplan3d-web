# Satellite Orbit Visualization System

This project is a Next.js web application for 3D satellite orbit visualization with CesiumJS. In addition to the visualization view, it also includes authentication, an admin panel, and API proxy routes for satellite, sensor, track, path, and scheduling data.

## Environment Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure environment variables in `.env.local`:
```bash
NEXTAUTH_SECRET=your-secret
API_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- 3D satellite orbit visualization powered by CesiumJS
- Time-based orbit display, path rendering, and animation controls
- Tree-based satellite and sensor selection
- Area-based scheduling workflow from the visualization interface
- Admin login and satellite management pages
- Next.js API routes for authentication and backend API forwarding

## Project Structure

- `pages/index.js` - Main visualization page
- `components/SatelliteViewer.js` - Top-level Cesium viewer container
- `components/satellite/SatelliteVisualizer.js` - Satellite visualization logic
- `components/satellite/SatelliteTree.js` - Satellite and sensor tree view
- `components/satellite/SatelliteControls.js` - Viewer interaction controls
- `pages/login.js` - Admin login page
- `pages/admin/index.js` - Admin dashboard entry
- `components/admin/SatelliteManager.js` - Satellite management UI
- `pages/api/` - Next.js API routes for auth, satellites, sensors, orders, scheduling, TLE, path points, and track points
- `utils/satellite/apiService.js` - Frontend API request helpers
- `utils/satellite/cesiumUtils.js` - Cesium viewer setup utilities
- `utils/satellite/orbitUtils.js` - Orbit-related utility functions
- `styles/globals.css` - Global styles
- `styles/SatelliteViewer.module.css` - Viewer-specific styles
- `next.config.js` - Next.js and Cesium build configuration

## Development Notes

1. The project currently uses Next.js 14, React 18, and CesiumJS.
2. `API_URL` must point to the backend service that provides login, satellite, sensor, order, and scheduling APIs.
3. `/admin` is protected by NextAuth credentials-based authentication and depends on `NEXTAUTH_SECRET` being configured.
4. Cesium static assets are served from the `public/cesium/` directory, so those files must remain available in deployment environments.
