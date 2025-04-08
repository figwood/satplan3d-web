import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import the SatelliteViewer component with no SSR since Cesium requires browser APIs
const SatelliteViewer = dynamic(
  () => import('../components/SatelliteViewer'),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Satellite Orbit Visualization</title>
        <meta name="description" content="Visualize satellite orbits in 3D" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div id="header">
          <h1>Satellite Orbit Visualization</h1>
        </div>
        <SatelliteViewer />
      </main>
    </>
  );
}
