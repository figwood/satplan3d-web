import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';
import styles from '../styles/SatelliteViewer.module.css';

const SatelliteViewer = () => {
  const viewerRef = useRef(null);
  const cesiumContainerRef = useRef(null);
  const creditsRef = useRef(null);  // Add new ref for credits
  const [cameraHeight, setCameraHeight] = useState(null);
  const [debugMessages, setDebugMessages] = useState([]);
  
  // Helper function to add debug messages
  const addDebug = (message) => {
    console.log(message);
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Cesium with the correct base URL
      window.CESIUM_BASE_URL = '/cesium/';
      
      // Set access token - still keeping this in case some other features need it
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTczYTJlMi0yYzE4LTQ4YTgtOWI2Zi1mMTg2YTg1ZWE1NjEiLCJpZCI6MjkxNTQwLCJpYXQiOjE3NDQwMDk5OTZ9.k1W2lo4Qh-AgmN9-ZM87Rsf1BZlr72QGcKgKoClBjO0';
      
      try {
        addDebug("Initializing Cesium with MBTiles imagery provider");
        
        // Test if the MBTiles API is accessible
        fetch('/api/mbtiles-info')
          .then(res => res.json())
          .then(data => {
            addDebug(`MBTiles info loaded: ${data.file ? data.file.sizeInMB + 'MB' : 'Not available'}`);
            if (data.metadata) {
              addDebug(`MBTiles format: ${data.metadata.format || 'unknown'}, min zoom: ${data.metadata.minzoom || '?'}, max zoom: ${data.metadata.maxzoom || '?'}`);
            }
          })
          .catch(err => addDebug(`Failed to load MBTiles info: ${err.message}`));
        
        // Configure geographic projection
        const rectangle = Cesium.Rectangle.fromDegrees(-180, -90, 180, 90);
        
        // Create dedicated credits element
        const creditsContainer = document.createElement('div');
        creditsContainer.style.display = 'none';
        creditsRef.current = creditsContainer;
        
        // Create viewer with proper initialization - without initial provider
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          baseLayerPicker: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          timeline: false,
          animation: false,
          sceneModePicker: true,
          navigationHelpButton: false,
          geocoder: false, // Remove the search/find tool
          sceneMode: Cesium.SceneMode.SCENE3D,
          orderIndependentTranslucency: true,
          creditContainer: creditsContainer
        });

        // Set the globe to be visible but transparent by default
        viewer.scene.globe.baseColor = Cesium.Color.BLACK;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.globe.showWaterEffect = false;
        
        // Add MBTiles imagery provider as the only layer
        const mbtilesLayer = viewer.imageryLayers.addImageryProvider(
          new Cesium.UrlTemplateImageryProvider({
            url: '/api/mbtiles/{z}/{x}/{y}',
            fileExtension: '',
            minimumLevel: 0,
            maximumLevel: 18,
            tileWidth: 256,
            tileHeight: 256,
            enablePickFeatures: false,
            rectangle: rectangle,
            credit: 'Bing Maps MBTiles'
          })
        );
        
        // Ensure layer is visible and properly rendered
        mbtilesLayer.show = true;
        viewer.scene.requestRender();
        
        // Store the viewer reference before adding handlers
        viewerRef.current = viewer;
        
        // Set initial view to show the full globe
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0
          }
        });
        
        // Customize the toolbar - add zoom buttons
        const toolbar = document.querySelector('.cesium-viewer-toolbar');
        
        // Create Zoom In button and add it to the toolbar
        const zoomInButton = document.createElement('button');
        zoomInButton.className = 'cesium-button cesium-toolbar-button';
        zoomInButton.innerHTML = '+';
        zoomInButton.title = 'Zoom In';
        zoomInButton.onclick = () => {
          zoomIn();
        };
        
        // Create Zoom Out button and add it to the toolbar
        const zoomOutButton = document.createElement('button');
        zoomOutButton.className = 'cesium-button cesium-toolbar-button';
        zoomOutButton.innerHTML = '−';
        zoomOutButton.title = 'Zoom Out';
        zoomOutButton.onclick = () => {
          zoomOut();
        };
        
        // Add buttons to toolbar (after it's fully loaded)
        setTimeout(() => {
          if (toolbar) {
            // Insert at the beginning of the toolbar
            const firstChild = toolbar.firstChild;
            toolbar.insertBefore(zoomInButton, firstChild);
            toolbar.insertBefore(zoomOutButton, firstChild);
          }
        }, 500);
        
        // Debug the tile loading process
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((queuedTileCount) => {
          if (queuedTileCount === 0) {
            // Force a re-render
            viewer.scene.requestRender();
          }
        });

        // Add a debug handler to show coordinates on mouse move
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
          // Only run this if the viewer is still valid
          if (!viewerRef.current) return;
          
          try {
            const cartesian = viewer.camera.pickEllipsoid(movement.endPosition);
            if (cartesian) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const lat = Cesium.Math.toDegrees(cartographic.latitude);
              const lon = Cesium.Math.toDegrees(cartographic.longitude);
              setCameraHeight(viewer.camera.positionCartographic.height);
            }
          } catch (e) {
            // Silent catch - no need to log mouse move errors
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      } catch (error) {
        addDebug(`ERROR initializing Cesium viewer: ${error.message}`);
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
      name,
      position: points[0],
      box: {
        dimensions: new Cesium.Cartesian3(500, 500, 500),
        material: color
      },
      point: {
        pixelSize: 10,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: name,
        font: '12pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      }
    });
  };
  
  const clearSatellites = () => {
    if (viewerRef.current) {
      viewerRef.current.entities.removeAll();
    }
  };
  
  const zoomIn = () => {
    if (viewerRef.current) {
      const camera = viewerRef.current.camera;
      const cameraPosition = camera.position;
      const cameraDirection = camera.direction;
      
      // Move the camera closer by 25%
      const moveDistance = Cesium.Cartesian3.magnitude(cameraPosition) * 0.25;
      const movementVector = Cesium.Cartesian3.multiplyByScalar(
        cameraDirection, 
        moveDistance, 
        new Cesium.Cartesian3()
      );
      
      const newPosition = Cesium.Cartesian3.add(
        cameraPosition,
        movementVector,
        new Cesium.Cartesian3()
      );
      
      camera.flyTo({
        destination: newPosition,
        orientation: {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll
        },
        duration: 1.0
      });
    }
  };
  
  const zoomOut = () => {
    if (viewerRef.current) {
      const camera = viewerRef.current.camera;
      const cameraPosition = camera.position;
      const cameraDirection = camera.direction;
      
      // Move the camera farther by 25%
      const moveDistance = Cesium.Cartesian3.magnitude(cameraPosition) * 0.25;
      const movementVector = Cesium.Cartesian3.multiplyByScalar(
        cameraDirection, 
        -moveDistance, 
        new Cesium.Cartesian3()
      );
      
      const newPosition = Cesium.Cartesian3.add(
        cameraPosition,
        movementVector,
        new Cesium.Cartesian3()
      );
      
      camera.flyTo({
        destination: newPosition,
        orientation: {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll
        },
        duration: 1.0
      });
    }
  };
  
  return (
    <div className={styles.fullscreenContainer} style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      display: 'block',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <div id="cesiumContainer" ref={cesiumContainerRef} className={styles.cesiumContainer}></div>
    </div>
  );
};

export default SatelliteViewer;