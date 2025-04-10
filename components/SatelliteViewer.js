import { useEffect, useState, useRef } from 'react';
import * as Cesium from 'cesium';
import { Tree } from 'antd';
import styles from '../styles/SatelliteViewer.module.css';

// 从轨道点数据生成 Cesium 位置数组，遇到经度跨越 180 度时停止
const generatePositionsFromTrackPoints = (trackPoints) => {
  const points = [];
  
  for (let i = 0; i < trackPoints.length - 1; i++) {
    const point = trackPoints[i];
    // 将高度从千米转换为米
    points.push(Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.alt * 1000));
    
    const nextPoint = trackPoints[i + 1];
    // 检查是否跨越 180 度经线
    if (Math.abs(nextPoint.lon - point.lon) > 180) {
      // 如果跨越了 180 度经线，就停止添加点
      break;
    }
  }
  
  return points;
};

// 计算经过一点且与速度矢量相切的大圆上的点
const generateGreatCirclePoints = (point, velocity) => {
  // 将经纬度转换为笛卡尔坐标
  const position = Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.alt);
  const vel = new Cesium.Cartesian3(point.vx, point.vy, point.vz);
  
  // 计算法向量（位置矢量和速度矢量的叉乘）
  const normal = Cesium.Cartesian3.cross(position, vel, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(normal, normal);
  
  // 生成大圆上的点
  const points = [];
  const steps = 360;
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    
    // 计算大圆上的点：R = P*cos(θ) + (N×P)*sin(θ)
    // 其中 P 是初始点，N 是法向量，θ 是角度
    const pos = new Cesium.Cartesian3();
    const cross = Cesium.Cartesian3.cross(normal, position, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(cross, cross);
    
    const p1 = Cesium.Cartesian3.multiplyByScalar(
      Cesium.Cartesian3.normalize(position, new Cesium.Cartesian3()),
      Math.cos(angle),
      new Cesium.Cartesian3()
    );
    const p2 = Cesium.Cartesian3.multiplyByScalar(
      cross,
      Math.sin(angle),
      new Cesium.Cartesian3()
    );
    
    Cesium.Cartesian3.add(p1, p2, pos);
    Cesium.Cartesian3.multiplyByScalar(pos, Cesium.Cartesian3.magnitude(position), pos);
    points.push(pos);
  }
  
  return points;
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
  const [allTrackPoints, setAllTrackPoints] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [halfSelectedKeys, setHalfSelectedKeys] = useState([]);

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
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching track points:', error);
      return null;
    }
  };

  const fetchPathPoints = async (noard_id, sensor_name) => {
    try {
      const response = await fetch(`/api/path-points?noard_id=${noard_id}&sensor_name=${sensor_name}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching path points:', error);
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
    
    // Add checked satellites and sensors
    for (const node of info.checkedNodes) {
      if (node.isLeaf && node.data) {
        const { name, noard_id, hex_color, sensorName } = node.data;
        
        // 如果是叶子节点，说明是传感器节点
        const isSensor = node.isLeaf;
        
        if (isSensor) {
          // Fetch path points for this sensor
          const pathPoints = await fetchPathPoints(noard_id, sensorName);
          if (!pathPoints || pathPoints.length === 0) continue;
          
          const color = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
          
          // Add line connecting all (lon1, lat1) points
          const points1 = pathPoints.map(point => 
            Cesium.Cartesian3.fromDegrees(point.lon1, point.lat1, 10000)
          );
          viewerRef.current.entities.add({
            name: `${sensorName} Path 1`,
            polyline: {
              positions: points1,
              width: 2,
              material: color
            }
          });

          // Add line connecting all (lon2, lat2) points
          const points2 = pathPoints.map(point => 
            Cesium.Cartesian3.fromDegrees(point.lon2, point.lat2, 10000)
          );
          viewerRef.current.entities.add({
            name: `${sensorName} Path 2`,
            polyline: {
              positions: points2,
              width: 2,
              material: color
            }
          });
        } else {
          // Handle regular satellite visualization
          const trackPoints = await fetchTrackPoints(noard_id);
          if (!trackPoints || trackPoints.length === 0) continue;
          
          const color = Cesium.Color.fromCssColorString(hex_color || '#FFFFFF');
          const points = generatePositionsFromTrackPoints(trackPoints);
          
          // Add orbit line
          viewerRef.current.entities.add({
            name: name + " Orbit",
            polyline: {
              positions: points,
              width: 2,
              material: color
            }
          });
          
          // Add satellite entity
          const satellitePosition = Cesium.Cartesian3.fromDegrees(
            trackPoints[0].lon, 
            trackPoints[0].lat, 
            trackPoints[0].alt * 1000
          );
          
          viewerRef.current.entities.add({
            name: name,
            position: satellitePosition,
            box: {
              dimensions: new Cesium.Cartesian3(500, 500, 500),
              material: color,
              outline: true,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1
            },
            point: {
              pixelSize: 8,
              color: color,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1
            },
            label: {
              text: name,
              font: '12pt sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: color,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              showBackground: true,
              backgroundColor: new Cesium.Color(0, 0, 0, 0.6)
            }
          });
        }

        // Update clock settings if we have track points
        if (!isSensor) {  // Only update clock for satellites
          const trackPoints = await fetchTrackPoints(noard_id);
          if (trackPoints && trackPoints.length > 0) {
            const startTime = Cesium.JulianDate.fromDate(new Date(trackPoints[0].time * 1000));
            const stopTime = Cesium.JulianDate.fromDate(new Date(trackPoints[trackPoints.length - 1].time * 1000));
            viewerRef.current.clock.startTime = startTime;
            viewerRef.current.clock.stopTime = stopTime;
            viewerRef.current.clock.currentTime = startTime;
            viewerRef.current.clock.multiplier = 60;
            viewerRef.current.clock.shouldAnimate = true;
            viewerRef.current.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
          }
        }
      }
    }
  };

  const onSelect = async (selectedKeys, info) => {
    if (!viewerRef.current || !info.node || !info.node.data) return;
    
    const { key } = info.node;
    
    if (halfSelectedKeys.includes(key)) {
      // 如果节点已经在半选择状态，则完全选中
      setHalfSelectedKeys(halfSelectedKeys.filter(k => k !== key));
      setSelectedNode(info.node);
      
      const { noard_id, sensorName } = info.node.data;
      
      // 使用 isLeaf 判断是否为传感器节点
      if (info.node.isLeaf) {
        // Fetch path points for this sensor
        const pathPoints = await fetchPathPoints(noard_id, sensorName);
        if (!pathPoints || pathPoints.length === 0) return;
        
        // Clear previous path lines
        const entities = viewerRef.current.entities.values;
        for (let i = entities.length - 1; i >= 0; i--) {
          const entity = entities[i];
          if (entity.name && (entity.name.includes('Path 1') || entity.name.includes('Path 2'))) {
            viewerRef.current.entities.remove(entity);
          }
        }
        
        const color = Cesium.Color.fromCssColorString(info.node.data.hex_color || '#FFFFFF');
        
        // Add line connecting all (lon1, lat1) points
        const points1 = pathPoints.map(point => 
          Cesium.Cartesian3.fromDegrees(point.lon1, point.lat1, 10000)
        );
        viewerRef.current.entities.add({
          name: `${sensorName} Path 1`,
          polyline: {
            positions: points1,
            width: 2,
            material: color
          }
        });

        // Add line connecting all (lon2, lat2) points
        const points2 = pathPoints.map(point => 
          Cesium.Cartesian3.fromDegrees(point.lon2, point.lat2, 10000)
        );
        viewerRef.current.entities.add({
          name: `${sensorName} Path 2`,
          polyline: {
            positions: points2,
            width: 2,
            material: color
          }
        });
      }
    } else {
      // 第一次点击，设置半选择状态
      setHalfSelectedKeys([...halfSelectedKeys, key]);
      setSelectedNode(null);
    }
  };

  const toggleTreeview = () => {
    setShowTreeview(!showTreeview);
  };

  const titleRender = (nodeData) => {
    return (
      <span
        data-half-selected={halfSelectedKeys.includes(nodeData.key)}
        style={{ display: 'block', padding: '0 4px' }}
      >
        {nodeData.title}
      </span>
    );
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
              onSelect={onSelect}
              selectedKeys={selectedNode ? [selectedNode.key] : []}
              treeData={[satelliteData]}
              defaultExpandAll={true}
              className={`${styles.antTree} ${styles.customTree}`}
              titleRender={titleRender}
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