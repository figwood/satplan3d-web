import * as Cesium from 'cesium';

/**
 * 初始化 Cesium 查看器
 * @param {HTMLElement} container Cesium 容器元素
 * @param {HTMLElement} creditsContainer 用于隐藏 credits 的容器元素
 * @returns {Cesium.Viewer} 初始化的 Cesium 查看器实例
 */
export const initCesiumViewer = (container, creditsContainer) => {
  if (typeof window === 'undefined') return null;
  
  window.CESIUM_BASE_URL = '/cesium/';
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTczYTJlMi0yYzE4LTQ4YTgtOWI2Zi1mMTg2YTg1ZWE1NjEiLCJpZCI6MjkxNTQwLCJpYXQiOjE3NDQwMDk5OTZ9.k1W2lo4Qh-AgmN9-ZM87Rsf1BZlr72QGcKgKoClBjO0';
  
  try {
    // 创建范围
    const rectangle = Cesium.Rectangle.fromDegrees(-180, -90, 180, 90);
    
    // 创建查看器
    const viewer = new Cesium.Viewer(container, {
      baseLayerPicker: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      timeline: false,
      animation: false,
      sceneModePicker: false, // 禁用默认的场景模式选择器
      navigationHelpButton: false,
      geocoder: false,
      sceneMode: Cesium.SceneMode.SCENE3D,
      orderIndependentTranslucency: true,
      creditContainer: creditsContainer,
      navigationInstructionsInitiallyVisible: false,
      homeButton: true,
      fullscreenButton: false, // 禁用默认全屏按钮，我们会添加自定义的
      vrButton: false,
      selectionIndicator: false,
      infoBox: false
    });

    // 设置地球和背景颜色
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    viewer.scene.globe.showWaterEffect = false;

    // 添加底图图层
    const mbtilesLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: '/tiles/{z}/{x}/{reverseY}.png',
        minimumLevel: 1,
        maximumLevel: 5,
        tileWidth: 256,
        tileHeight: 256,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        customTags: {
          reverseY: function(imageryProvider, x, y, level) {
            const tmsY = Math.pow(2, level) - y - 1;
            return tmsY;
          }
        },
        credit: 'GDAL2Tiles Imagery'
      })
    );
    mbtilesLayer.show = true;
    viewer.scene.requestRender();
    
    // 初始化视角
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
      orientation: {
        heading: 0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0
      }
    });
    
    // 添加自定义按钮到默认工具栏
    setTimeout(() => {
      addCustomButtons(viewer);
    }, 200);
    
    return viewer;
  } catch (error) {
    console.error('Error initializing Cesium viewer:', error);
    return null;
  }
};

/**
 * 添加自定义按钮到 Cesium 默认工具栏
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 */
export const addCustomButtons = (viewer) => {
  if (!viewer) return;
  
  // 获取工具栏元素
  const toolbar = viewer.container.querySelector('.cesium-viewer-toolbar');
  if (!toolbar) return;
  
  // 创建 Zoom In 按钮
  const zoomInButton = document.createElement('button');
  zoomInButton.className = 'cesium-button cesium-toolbar-button';
  zoomInButton.title = '放大';
  zoomInButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M15 7H9V1H7v6H1v2h6v6h2V9h6z" fill="currentColor"/></svg>';
  zoomInButton.onclick = () => {
    zoomIn(viewer);
  };
  
  // 创建 Zoom Out 按钮
  const zoomOutButton = document.createElement('button');
  zoomOutButton.className = 'cesium-button cesium-toolbar-button';
  zoomOutButton.title = '缩小';
  zoomOutButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M15 7H1v2h14z" fill="currentColor"/></svg>';
  zoomOutButton.onclick = () => {
    zoomOut(viewer);
  };
  
  // 创建全屏按钮，修复SVG图标使其上下左右对称
  const fullscreenButton = document.createElement('button');
  fullscreenButton.className = 'cesium-button cesium-toolbar-button';
  fullscreenButton.title = '全屏';
  fullscreenButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 2v4h2V4h2V2H2zm8 2V2h4v4h-2V4h-2zm-6 8H2v-4h2v2h2v2zm6-2h2v-2h2v4h-4v-2z" fill="currentColor"/></svg>';
  fullscreenButton.onclick = () => {
    toggleFullscreen(document.body);
  };
  
  // 移除可能已存在的旧按钮
  const existingButtons = toolbar.querySelectorAll('.cesium-toolbar-button');
  existingButtons.forEach(button => {
    const buttonTitle = button.getAttribute('title');
    if (buttonTitle && (buttonTitle.includes('放大') || buttonTitle.includes('缩小') || buttonTitle.includes('全屏'))) {
      button.remove();
    }
  });
  
  // 添加自定义按钮到工具栏
  toolbar.appendChild(zoomInButton);
  toolbar.appendChild(zoomOutButton);
  toolbar.appendChild(fullscreenButton);
};

/**
 * 放大相机视角
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 */
export const zoomIn = (viewer) => {
  if (!viewer) return;
  
  const camera = viewer.camera;
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
};

/**
 * 缩小相机视角
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 */
export const zoomOut = (viewer) => {
  if (!viewer) return;
  
  const camera = viewer.camera;
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
};

/**
 * 切换全屏模式
 * @param {HTMLElement} element 要全屏显示的元素
 */
export const toggleFullscreen = (element) => {
  if (!element) return;
  
  if (!document.fullscreenElement &&    // 标准 API
      !document.mozFullScreenElement && // Firefox
      !document.webkitFullscreenElement && // Chrome, Safari 和 Opera
      !document.msFullscreenElement) {  // IE/Edge
    
    // 进入全屏模式
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } else {
    // 退出全屏模式
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

/**
 * 添加卫星实体到地图
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 * @param {Object} position 卫星位置 {lon, lat, alt}
 * @param {String} name 卫星名称
 * @param {Cesium.Color} color 卫星颜色
 * @returns {Cesium.Entity} 创建的卫星实体
 */
export const addSatelliteEntity = (viewer, position, name, color) => {
  if (!viewer) return null;
  
  const satellitePosition = Cesium.Cartesian3.fromDegrees(
    position.lon, 
    position.lat, 
    position.alt * 1000 // 转换为米
  );
  
  return viewer.entities.add({
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
};

/**
 * 添加轨道线到地图
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 * @param {Array} positions 轨道点位置数组
 * @param {String} name 轨道名称
 * @param {Cesium.Color} color 轨道颜色
 * @returns {Cesium.Entity} 创建的轨道实体
 */
export const addOrbitPath = (viewer, positions, name, color) => {
  if (!viewer) return null;
  
  return viewer.entities.add({
    name: name + " Orbit",
    polyline: {
      positions: positions,
      width: 2,
      material: color,
      clampToGround: false
    }
  });
};

/**
 * 添加传感器路径到地图
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 * @param {Array} pathPoints 路径点数据数组
 * @param {String} sensorName 传感器名称
 * @param {Cesium.Color} color 路径颜色
 */
export const addSensorPaths = (viewer, pathPoints, sensorName, color) => {
  if (!viewer || !pathPoints || pathPoints.length === 0) return;
  
  // 添加传感器路径线 1
  const points1 = pathPoints.map(point => 
    Cesium.Cartesian3.fromDegrees(point.lon1, point.lat1, 10000)
  );
  viewer.entities.add({
    name: `${sensorName} Path 1`,
    polyline: {
      positions: points1,
      width: 2,
      material: color
    }
  });
  
  // 添加传感器路径线 2
  const points2 = pathPoints.map(point => 
    Cesium.Cartesian3.fromDegrees(point.lon2, point.lat2, 10000)
  );
  viewer.entities.add({
    name: `${sensorName} Path 2`,
    polyline: {
      positions: points2,
      width: 2,
      material: color
    }
  });
};

/**
 * 为相机添加鼠标事件，更新高度显示
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 * @param {Function} setCameraHeight 用于更新相机高度的函数
 * @returns {Cesium.ScreenSpaceEventHandler} 事件处理器
 */
export const setupCameraEvents = (viewer, setCameraHeight) => {
  if (!viewer) return null;
  
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    if (!viewer) return;
    try {
      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition);
      if (cartesian) {
        setCameraHeight(viewer.camera.positionCartographic.height);
      }
    } catch (e) {
      // 错误处理
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
  return handler;
};

/**
 * 更新时钟设置
 * @param {Cesium.Viewer} viewer Cesium 查看器实例
 * @param {Array} trackPoints 轨道点数据
 */
export const updateClockSettings = (viewer, trackPoints) => {
  if (!viewer || !trackPoints || trackPoints.length === 0) return;
  
  const startTime = Cesium.JulianDate.fromDate(new Date(trackPoints[0].time * 1000));
  const stopTime = Cesium.JulianDate.fromDate(new Date(trackPoints[trackPoints.length - 1].time * 1000));
  viewer.clock.startTime = startTime;
  viewer.clock.stopTime = stopTime;
  viewer.clock.currentTime = startTime;
  viewer.clock.multiplier = 60;
  viewer.clock.shouldAnimate = true;
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
};