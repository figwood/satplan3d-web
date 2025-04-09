const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle native modules
    if (!isServer) {
      // Don't resolve 'fs', 'net' on the client side
      config.resolve.fallback = {
        fs: false,
        path: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Copy assets and setup for Cesium
    if (!config.plugins) {
      config.plugins = [];
    }

    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve('cesium')),
              'Build/Cesium/Workers'
            ),
            to: path.join(__dirname, 'public/cesium/Workers'),
          },
          {
            from: path.join(
              path.dirname(require.resolve('cesium')),
              'Build/Cesium/ThirdParty'
            ),
            to: path.join(__dirname, 'public/cesium/ThirdParty'),
          },
          {
            from: path.join(
              path.dirname(require.resolve('cesium')),
              'Build/Cesium/Assets'
            ),
            to: path.join(__dirname, 'public/cesium/Assets'),
          },
          {
            from: path.join(
              path.dirname(require.resolve('cesium')),
              'Build/Cesium/Widgets'
            ),
            to: path.join(__dirname, 'public/cesium/Widgets'),
          },
        ],
      })
    );

    return config;
  },
  // Add this to deal with potential SQLite buffer size issues
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
};

module.exports = nextConfig;
