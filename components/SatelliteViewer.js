import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';

const SatelliteViewer = () => {
  const viewerRef = useRef(null);
  const cesiumContainerRef = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Cesium with the correct base URL
      window.CESIUM_BASE_URL = '/cesium/';
      
      // Set access token
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTczYTJlMi0yYzE4LTQ4YTgtOWI2Zi1mMTg2YTg1ZWE1NjEiLCJpZCI6MjkxNTQwLCJpYXQiOjE3NDQwMDk5OTZ9.k1W2lo4Qh-AgmN9-ZM87Rsf1BZlr72QGcKgKoClBjO0';
      
      try {
        // Instead of using getDefaultTokenCredit(), we'll just log the token information
        console.log("Using Cesium Ion access token");
        
        // Create terrain provider with proper error handling
        let terrainProvider;
        try {
          if (Cesium.createWorldTerrain) {
            terrainProvider = Cesium.createWorldTerrain();
          } else if (Cesium.Terrain && Cesium.Terrain.fromWorldTerrain) {
            terrainProvider = Cesium.Terrain.fromWorldTerrain();
          }
        } catch (error) {
          console.warn('Error creating terrain provider:', error);
          console.warn('Falling back to EllipsoidTerrainProvider');
          terrainProvider = undefined;
        }
        
        // Create viewer with safe options
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          baseLayerPicker: true,
          timeline: true,
          animation: true,
          sceneModePicker: true,
          // Only add terrainProvider if successfully created
          ...(terrainProvider ? { terrainProvider } : {})
        });

        // Set initial camera position
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000)
        });

        // Enable lighting based on sun/moon positions
        viewer.scene.globe.enableLighting = true;
        
        viewerRef.current = viewer;
      } catch (error) {
        console.error('Error initializing Cesium viewer:', error);
      }
      
      return () => {
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }
      };
    }
  }, []);
  
  const addSatellite = () => {
    if (!viewerRef.current) return;
    
    // For demo purposes, create a random satellite
    const name = "Satellite " + Math.floor(Math.random() * 1000);
    
    // Random orbit parameters (simplified)
    const semiMajorAxis = 6700000 + Math.random() * 2000000; // in meters
    const eccentricity = Math.random() * 0.2;
    const inclination = Math.random() * 180; // in degrees
    const rightAscension = Math.random() * 360; // in degrees
    const argumentOfPeriapsis = Math.random() * 360; // in degrees
    const meanAnomaly = Math.random() * 360; // in degrees
    
    // Generate random color for this satellite
    const color = Cesium.Color.fromRandom({ alpha: 1.0 });
    
    // Create orbital parameters
    const orbitalParameters = {
      semiMajorAxis,
      eccentricity,
      inclination,
      rightAscension,
      argumentOfPeriapsis,
      meanAnomaly
    };
    
    // Generate orbit points
    const points = generateOrbitPoints(orbitalParameters);
    
    // Create the orbit path entity
    const orbitEntity = viewerRef.current.entities.add({
      name: name + " Orbit",
      position: points[0],
      path: {
        material: color,
        width: 2,
        leadTime: 0,
        trailTime: 60 * 60,
        resolution: 120
      },
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        start: Cesium.JulianDate.now(),
        stop: Cesium.JulianDate.addSeconds(Cesium.JulianDate.now(), 60 * 60, new Cesium.JulianDate())
      })]),
      position: {
        interpolationAlgorithm: Cesium.LinearApproximation,
        interpolationDegree: 2,
        referenceFrame: Cesium.ReferenceFrame.INERTIAL,
        epoch: Cesium.JulianDate.now(),
        cartesian: points
      }
    });
    
    // Create the satellite entity using a box instead of an external model
    const satelliteEntity = viewerRef.current.entities.add({
      name: name,
      position: points[0],
      // Use a simple box instead of an external 3D model
      box: {
        dimensions: new Cesium.Cartesian3(500, 500, 500),
        material: color
      },
      // Alternatively, use a point if the box doesn't render well
      point: {
        pixelSize: 10,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: name,
        font: '14pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      },
      path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: color
        }),
        width: 3
      }
    });
    
    // Set up clock to animate the satellite
    viewerRef.current.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewerRef.current.clock.startTime = Cesium.JulianDate.now();
    viewerRef.current.clock.stopTime = Cesium.JulianDate.addSeconds(viewerRef.current.clock.startTime, 60 * 60, new Cesium.JulianDate());
    viewerRef.current.clock.currentTime = viewerRef.current.clock.startTime;
    viewerRef.current.clock.multiplier = 30; // Speed up time
    viewerRef.current.clock.shouldAnimate = true;
  };
  
  // Helper functions to compute orbital mechanics
  const generateOrbitPoints = (orbitalElements) => {
    const points = [];
    const { semiMajorAxis, eccentricity, inclination, 
            rightAscension, argumentOfPeriapsis, meanAnomaly } = orbitalElements;
    
    const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / 3.986004418e14);
    
    // Generate points for one complete orbit
    const steps = 360;
    for (let i = 0; i < steps; i++) {
      const time = new Date(Date.now() + (i / steps) * period * 1000);
      points.push(computePosition(orbitalElements, time));
    }
    
    return points;
  };
  
  const computePosition = (orbitalElements, time) => {
    const GM = 3.986004418e14; // Earth's gravitational constant (m^3/s^2)
    
    // Extract orbital elements
    const { semiMajorAxis, eccentricity, inclination, 
            rightAscension, argumentOfPeriapsis, meanAnomaly } = orbitalElements;
    
    // Convert angles to radians
    const incRad = Cesium.Math.toRadians(inclination);
    const raRad = Cesium.Math.toRadians(rightAscension);
    const argPeriRad = Cesium.Math.toRadians(argumentOfPeriapsis);
    const meanAnomalyRad = Cesium.Math.toRadians(meanAnomaly);
    
    // Solve Kepler's equation (simplified approach for demo)
    // In a real application, you would iterate to find eccentric anomaly
    let E = meanAnomalyRad;
    for (let i = 0; i < 10; i++) {
      E = meanAnomalyRad + eccentricity * Math.sin(E);
    }
    
    // Calculate position in orbital plane
    const xOrbit = semiMajorAxis * (Math.cos(E) - eccentricity);
    const yOrbit = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);
    
    // Rotation matrices to convert to Earth-centered inertial frame
    const cosRA = Math.cos(raRad);
    const sinRA = Math.sin(raRad);
    const cosInc = Math.cos(incRad);
    const sinInc = Math.sin(incRad);
    const cosArgPeri = Math.cos(argPeriRad);
    const sinArgPeri = Math.sin(argPeriRad);
    
    // Apply rotation matrices
    const x = (cosRA * cosArgPeri - sinRA * sinArgPeri * cosInc) * xOrbit + 
             (-cosRA * sinArgPeri - sinRA * cosArgPeri * cosInc) * yOrbit;
    const y = (sinRA * cosArgPeri + cosRA * sinArgPeri * cosInc) * xOrbit + 
             (-sinRA * sinArgPeri + cosRA * cosArgPeri * cosInc) * yOrbit;
    const z = (sinArgPeri * sinInc) * xOrbit + (cosArgPeri * sinInc) * yOrbit;
    
    return new Cesium.Cartesian3(x, y, z);
  };
  
  const clearSatellites = () => {
    if (viewerRef.current) {
      viewerRef.current.entities.removeAll();
    }
  };
  
  return (
    <div>
      <div id="cesiumContainer" ref={cesiumContainerRef}></div>
      <div className="toolbar">
        <button onClick={addSatellite}>Add Satellite</button>
        <button onClick={clearSatellites}>Clear All</button>
      </div>
    </div>
  );
};

export default SatelliteViewer;
