# Setting Up Cesium for Satellite Visualization

This guide helps you set up Cesium correctly for the Satellite Orbit Visualization application.

## 1. Access Token Setup

1. Create a free account at [https://cesium.com/ion/signup](https://cesium.com/ion/signup)
2. Get your access token from [https://cesium.com/ion/tokens](https://cesium.com/ion/tokens)
3. Update the token in `components/SatelliteViewer.js`:

```javascript
Cesium.Ion.defaultAccessToken = 'YOUR_ACCESS_TOKEN_HERE';
```

## 2. Compatibility Notes

This application has been designed to work with Cesium version 1.104.0, which is specified in the package.json file. If you encounter compatibility issues, you may need to:

1. Check that the correct version is installed:
