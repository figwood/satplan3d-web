import * as Cesium from 'cesium';

// 从轨道点数据生成 Cesium 位置数组，遇到经度跨越 180 度时停止
export const generatePositionsFromTrackPoints = (trackPoints) => {
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

export const generateOrbitPoints = (orbitalElements) => {
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