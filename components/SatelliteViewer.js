import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';
import { Tree } from 'antd';
import styles from '../styles/SatelliteViewer.module.css';

// 从轨道点数据生成 Cesium 位置数组
const generatePositionsFromTrackPoints = (trackPoints) => {
  return trackPoints.map(point => {
    return Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.alt);
  });
};

const generateOrbitPoints = (orbitalElements) => {
  const { semiMajorAxis, eccentricity, inclination, 
          rightAscension, argumentOfPeriapsis, meanAnomaly } = orbitalElements;
  
  const points = [];
  const GM = 3.986004418e14; // Earth's gravitational constant (m^3/s^2)
  const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / GM);
  
  // Convert angles to radians
  const incRad = Cesium.Math.toRadians(inclination);
  const raRad = Cesium.Math.toRadians(rightAscension);
  const argPeriRad = Cesium.Math.toRadians(argumentOfPeriapsis);
  const meanAnomalyRad = Cesium.Math.toRadians(meanAnomaly);
  
  // Generate points for one complete orbit
  const steps = 360;
  for (let i = 0; i < steps; i++) {
    const E = meanAnomalyRad + (i / steps) * 2 * Math.PI;
    
    // Calculate position in orbital plane
    const xOrbit = semiMajorAxis * (Math.cos(E) - eccentricity);
    const yOrbit = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);
    
    // Convert to Earth-centered inertial frame
    const cosRA = Math.cos(raRad);
    const sinRA = Math.sin(raRad);
    const cosInc = Math.cos(incRad);
    const sinInc = Math.sin(incRad);
    const cosArgPeri = Math.cos(argPeriRad);
    const sinArgPeri = Math.sin(argPeriRad);
    
    const x = (cosRA * cosArgPeri - sinRA * sinArgPeri * cosInc) * xOrbit + 
             (-cosRA * sinArgPeri - sinRA * cosArgPeri * cosInc) * yOrbit;
    const y = (sinRA * cosArgPeri + cosRA * sinArgPeri * cosInc) * xOrbit + 
             (-sinRA * sinArgPeri + cosRA * cosArgPeri * cosInc) * yOrbit;
    const z = (sinArgPeri * sinInc) * xOrbit + (cosArgPeri * sinInc) * yOrbit;
    
    points.push(new Cesium.Cartesian3(x, y, z));
  }
  
  return points;
};

const SatelliteViewer = () => {
  const viewerRef = useRef(null);
  const cesiumContainerRef = useRef(null);
  const creditsRef = useRef(null);
  const [cameraHeight, setCameraHeight] = useState(null);
  const [showTreeview, setShowTreeview] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);

  const fetchSatelliteData = async () => {
    try {
      const response = await fetch('/api/satellites');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSatelliteData(data);
    } catch (error) {
      console.error('Error fetching satellite data:', error);
    }
  };

  const fetchTrackPoints = async (noard_id) => {
    try {
      const response = await fetch(`/api/track-points?noard_id=${noard_id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching track points:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  const onCheck = async (checkedKeys, info) => {
    if (!viewerRef.current) return;
    
    // Clear existing satellites first
    viewerRef.current.entities.removeAll();
    
    // Add checked satellites
    for (const node of info.checkedNodes) {
      if (node.isLeaf && node.data) {
        const { name, noard_id, hex_color } = node.data;
        
        // Fetch track points for this satellite
        const trackPoints = await fetchTrackPoints(noard_id);
        if (!trackPoints) continue;
        
        const points = generatePositionsFromTrackPoints(trackPoints);
        const color = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
        
        // Get start and stop times from the first and last track points
        const startTime = Cesium.JulianDate.fromDate(new Date(trackPoints[0].time * 1000));
        const stopTime = Cesium.JulianDate.fromDate(new Date(trackPoints[trackPoints.length - 1].time * 1000));
        
        const orbitEntity = viewerRef.current.entities.add({
          name: name + " Orbit",
          path: {
            material: color,
            width: 2,
            leadTime: 0,
            trailTime: 60 * 60,
            resolution: 120
          },
          availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
            start: startTime,
            stop: stopTime
          })]),
          position: {
            interpolationAlgorithm: Cesium.LinearApproximation,
            interpolationDegree: 2,
            referenceFrame: Cesium.ReferenceFrame.INERTIAL,
            epoch: startTime,
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

        // Update clock settings
        viewerRef.current.clock.startTime = startTime;
        viewerRef.current.clock.stopTime = stopTime;
        viewerRef.current.clock.currentTime = startTime;
        viewerRef.current.clock.multiplier = 60; // Speed up time
        viewerRef.current.clock.shouldAnimate = true;
        viewerRef.current.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      }
    }
  };

  const toggleTreeview = () => {
    setShowTreeview(!showTreeview);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.CESIUM_BASE_URL = '/cesium/';
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTczYTJlMi0yYzE4LTQ4YTgtOWI2Zi1mMTg2YTg1ZWE1NjEiLCJpZCI6MjkxNTQwLCJpYXQiOjE3NDQwMDk5OTZ9.k1W2lo4Qh-AgmN9-ZM87Rsf1BZlr72QGcKgKoClBjO0';
      
      try {
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

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement) => {
          if (!viewerRef.current) return;
          try {
            const cartesian = viewer.camera.pickEllipsoid(movement.endPosition);
            if (cartesian) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              setCameraHeight(viewer.camera.positionCartographic.height);
            }
          } catch (e) {
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
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
            <Tree
              checkable
              onCheck={onCheck}
              treeData={[satelliteData]}
              defaultExpandAll={true}
              className={styles.antTree}
              fieldNames={{
                title: 'title',
                key: 'key',
                children: 'children'
              }}
            />
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