import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';
import styles from '../styles/SatelliteViewer.module.css';

const SatelliteViewer = () => {
  const viewerRef = useRef(null);
  const cesiumContainerRef = useRef(null);
  const creditsRef = useRef(null);  // Add new ref for credits
  const [cameraHeight, setCameraHeight] = useState(null);
  const [debugMessages, setDebugMessages] = useState([]);
  const [showTreeview, setShowTreeview] = useState(false); // State to toggle treeview visibility
  const [satelliteData, setSatelliteData] = useState(null); // State to store satellite data
  
  // Helper function to add debug messages
  const addDebug = (message) => {
    console.log(message);
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Fetch satellite data from backend
  const fetchSatelliteData = async () => {
    try {
      const response = await fetch('/api/satellites');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSatelliteData(data);
      addDebug("Successfully fetched satellite data");
    } catch (error) {
      addDebug(`Failed to fetch satellite data: ${error.message}`);
      console.error('Error fetching satellite data:', error);
    }
  };

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  // Tree structure for the satellites
  const satelliteTree = {
    name: "Satellites",
    checked: false,
    children: [
      {
        name: "HJ-1A",
        checked: false,
        children: [
          { name: "CCD1", checked: false },
          { name: "CCD2", checked: false }
        ]
      },
      {
        name: "HJ-1B",
        checked: false,
        children: [
          { name: "CCD1", checked: false },
          { name: "CCD2", checked: false }
        ]
      }
    ]
  };
  
  // Function to handle checkbox change
  const handleCheckboxChange = (path) => {
    console.log("Checkbox changed:", path);
    // Implement the checkbox state management here
  };
  
  // Component for rendering tree nodes
  const TreeNode = ({ node, level = 0, path = [] }) => {
    const currentPath = [...path, node.name];
    
    return (
      <div className={styles.treeNode} style={{ paddingLeft: `${level * 20}px` }}>
        <label className={styles.treeNodeLabel}>
          <input 
            type="checkbox" 
            checked={node.checked || false}
            onChange={() => handleCheckboxChange(currentPath)}
          />
          {node.name}
        </label>
        
        {node.children && node.children.map((child, index) => (
          <TreeNode 
            key={index} 
            node={child} 
            level={level + 1} 
            path={currentPath}
          />
        ))}
      </div>
    );
  };
  
  // Toggle treeview visibility
  const toggleTreeview = () => {
    setShowTreeview(!showTreeview);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.CESIUM_BASE_URL = '/cesium/';
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTczYTJlMi0yYzE4LTQ4YTgtOWI2Zi1mMTg2YTg1ZWE1NjEiLCJpZCI6MjkxNTQwLCJpYXQiOjE3NDQwMDk5OTZ9.k1W2lo4Qh-AgmN9-ZM87Rsf1BZlr72QGcKgKoClBjO0';
      
      try {
        addDebug("Initializing Cesium with MBTiles imagery provider");
        
        fetch('/api/mbtiles-info')
          .then(res => res.json())
          .then(data => {
            addDebug(`MBTiles info loaded: ${data.file ? data.file.sizeInMB + 'MB' : 'Not available'}`);
            if (data.metadata) {
              addDebug(`MBTiles format: ${data.metadata.format || 'unknown'}, min zoom: ${data.metadata.minzoom || '?'}, max zoom: ${data.metadata.maxzoom || '?'}`);
            }
          })
          .catch(err => addDebug(`Failed to load MBTiles info: ${err.message}`));
        
        const rectangle = Cesium.Rectangle.fromDegrees(-180, -90, 180, 90);
        
        const creditsContainer = document.createElement('div');
        creditsContainer.style.display = 'none';
        creditsRef.current = creditsContainer;
        
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          baseLayerPicker: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          timeline: false,
          animation: false,
          sceneModePicker: true,
          navigationHelpButton: false,
          geocoder: false,
          sceneMode: Cesium.SceneMode.SCENE3D,
          orderIndependentTranslucency: true,
          creditContainer: creditsContainer
        });

        viewer.scene.globe.baseColor = Cesium.Color.BLACK;
        viewer.scene.backgroundColor = Cesium.Color.BLACK;
        viewer.scene.globe.showWaterEffect = false;
        
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
        
        mbtilesLayer.show = true;
        viewer.scene.requestRender();
        
        viewerRef.current = viewer;
        
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0
          }
        });
        
        const toolbar = document.querySelector('.cesium-viewer-toolbar');
        
        const zoomInButton = document.createElement('button');
        zoomInButton.className = 'cesium-button cesium-toolbar-button';
        zoomInButton.innerHTML = '+';
        zoomInButton.title = 'Zoom In';
        zoomInButton.onclick = () => {
          zoomIn();
        };
        
        const zoomOutButton = document.createElement('button');
        zoomOutButton.className = 'cesium-button cesium-toolbar-button';
        zoomOutButton.innerHTML = '−';
        zoomOutButton.title = 'Zoom Out';
        zoomOutButton.onclick = () => {
          zoomOut();
        };
        
        setTimeout(() => {
          if (toolbar) {
            const firstChild = toolbar.firstChild;
            toolbar.insertBefore(zoomInButton, firstChild);
            toolbar.insertBefore(zoomOutButton, firstChild);
          }
        }, 500);
        
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((queuedTileCount) => {
          if (queuedTileCount === 0) {
            viewer.scene.requestRender();
          }
        });

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
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
    
    const name = "Satellite " + Math.floor(Math.random() * 1000);
    
    const semiMajorAxis = 6700000 + Math.random() * 2000000;
    const eccentricity = Math.random() * 0.2;
    const inclination = Math.random() * 180;
    const rightAscension = Math.random() * 360;
    const argumentOfPeriapsis = Math.random() * 360;
    const meanAnomaly = Math.random() * 360;
    
    const color = Cesium.Color.fromRandom({ alpha: 1.0 });
    
    const orbitalParameters = {
      semiMajorAxis,
      eccentricity,
      inclination,
      rightAscension,
      argumentOfPeriapsis,
      meanAnomaly
    };
    
    const points = generateOrbitPoints(orbitalParameters);
    
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
      {/* TreeView Toggle Button */}
      <button 
        onClick={toggleTreeview}
        className={styles.treeviewToggle}
        style={{
          position: 'absolute',
          top: '10px',
          left: showTreeview ? '260px' : '10px',
          zIndex: 100,
          padding: '5px 10px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          transition: 'left 0.3s'
        }}
      >
        {showTreeview ? '<<' : '>>'}
      </button>
      
      {/* Treeview Panel */}
      <div 
        className={styles.treeviewPanel}
        style={{
          position: 'absolute',
          width: '250px',
          height: '100%',
          backgroundColor: 'rgba(30, 30, 30, 0.85)',
          color: 'white',
          left: showTreeview ? '0' : '-250px',
          top: 0,
          padding: '10px',
          boxSizing: 'border-box',
          zIndex: 99,
          transition: 'left 0.3s',
          overflow: 'auto'
        }}
      >
        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Satellite Data</h3>
        <div className={styles.treeview}>
          {satelliteData ? (
            <TreeNode node={satelliteData} />
          ) : (
            <p>Loading satellite data...</p>
          )}
        </div>
      </div>
      
      <div 
        id="cesiumContainer" 
        ref={cesiumContainerRef} 
        className={styles.cesiumContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          width: '100%',
          height: '100%'
        }}
      ></div>
    </div>
  );
};

export default SatelliteViewer;