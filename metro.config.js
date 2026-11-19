// metro.config.js
// Enables .wasm assets (required for expo-sqlite on web) and sets the
// Cross-Origin-Embedder-Policy / Cross-Origin-Opener-Policy headers so
// SharedArrayBuffer works in the browser.

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow Metro to serve .wasm files
config.resolver.assetExts.push('wasm');

// COOP / COEP headers required for SharedArrayBuffer (expo-sqlite web)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      middleware(req, res, next);
    };
  },
};

module.exports = config;
