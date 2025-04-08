// Initialize Cesium viewer
Cesium.Ion.defaultAccessToken = 'your-cesium-access-token'; // Replace with your Cesium ion access token

const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    baseLayerPicker: true,
    timeline: true,
    animation: true,
    sceneModePicker: true
});

// Set initial camera position
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000)
});

// Enable lighting based on sun/moon positions
viewer.scene.globe.enableLighting = true;

// Add satellite button listener
document.getElementById('addSatellite').addEventListener('click', function() {
    // For demo purposes, create a random satellite
    const name = "Satellite " + Math.floor(Math.random() * 1000);
    
    // Random orbit parameters (simplified)
    const semiMajorAxis = 6700000 + Math.random() * 2000000; // in meters
    const eccentricity = Math.random() * 0.2;
    const inclination = Math.random() * 180; // in degrees
    const rightAscension = Math.random() * 360; // in degrees
    const argumentOfPeriapsis = Math.random() * 360; // in degrees
    const meanAnomaly = Math.random() * 360; // in degrees
    
    const satellite = new Satellite(name, {
        semiMajorAxis: semiMajorAxis,
        eccentricity: eccentricity,
        inclination: inclination,
        rightAscension: rightAscension,
        argumentOfPeriapsis: argumentOfPeriapsis,
        meanAnomaly: meanAnomaly
    });
    
    satellite.visualize(viewer);
});

// Clear satellites button listener
document.getElementById('clearSatellites').addEventListener('click', function() {
    viewer.entities.removeAll();
});
