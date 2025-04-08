import * as Cesium from 'cesium';

export class Satellite {
    constructor(name, orbitalElements) {
        this.name = name;
        this.orbitalElements = orbitalElements;
        this.id = null; // Will store the Cesium entity ID
    }
    
    /**
     * Compute the satellite position at a given time
     * @param {Date} time - The time to compute position for
     * @returns {Cesium.Cartesian3} The position in Cartesian3 coordinates
     */
    computePosition(time) {
        const GM = 3.986004418e14; // Earth's gravitational constant (m^3/s^2)
        
        // Extract orbital elements
        const { semiMajorAxis, eccentricity, inclination, 
                rightAscension, argumentOfPeriapsis, meanAnomaly } = this.orbitalElements;
        
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
    }
    
    /**
     * Generate an array of positions for the satellite's orbit
     * @returns {Array} Array of Cesium.Cartesian3 positions
     */
    generateOrbitPoints() {
        const points = [];
        const period = 2 * Math.PI * Math.sqrt(Math.pow(this.orbitalElements.semiMajorAxis, 3) / 3.986004418e14);
        
        // Generate points for one complete orbit
        const steps = 360;
        for (let i = 0; i < steps; i++) {
            const time = new Date(Date.now() + (i / steps) * period * 1000);
            points.push(this.computePosition(time));
        }
        
        return points;
    }
    
    /**
     * Visualize the satellite and its orbit in the Cesium viewer
     * @param {Cesium.Viewer} viewer - Cesium viewer instance
     */
    visualize(viewer) {
        try {
            // Generate random color for this satellite
            const color = Cesium.Color.fromRandom({ alpha: 1.0 });
            
            // Generate orbit points
            const orbitPoints = this.generateOrbitPoints();
            
            // Create the orbit path entity
            const orbitEntity = viewer.entities.add({
                name: this.name + " Orbit",
                position: orbitPoints[0],
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
                    cartesian: orbitPoints
                }
            });
            
            // Create the satellite entity using simple shapes that don't require external assets
            const satelliteEntity = viewer.entities.add({
                name: this.name,
                position: orbitPoints[0],
                ellipsoid: {
                    radii: new Cesium.Cartesian3(300, 300, 500),
                    material: color,
                    outline: true,
                    outlineColor: Cesium.Color.WHITE
                },
                label: {
                    text: this.name,
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
            
            this.id = satelliteEntity.id;
            
            // Set up clock to animate the satellite
            viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
            viewer.clock.startTime = Cesium.JulianDate.now();
            viewer.clock.stopTime = Cesium.JulianDate.addSeconds(viewer.clock.startTime, 60 * 60, new Cesium.JulianDate());
            viewer.clock.currentTime = viewer.clock.startTime;
            viewer.clock.multiplier = 30; // Speed up time
            viewer.clock.shouldAnimate = true;
        } catch (error) {
            console.error("Error visualizing satellite:", error);
        }
    }
}
