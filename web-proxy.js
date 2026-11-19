/**
 * web-proxy.js
 * A tiny reverse proxy that sits on port 8082 and forwards to Expo's Metro
 * dev server on port 8081, injecting the Cross-Origin headers required for
 * SharedArrayBuffer (expo-sqlite wasm) on every response.
 *
 * Usage: node web-proxy.js
 * Then open http://localhost:8082 in the browser.
 */

const http = require('http');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, (proxyRes) => {
    // Inject COOP / COEP headers
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end('Metro not ready yet. Try refreshing.');
  });

  req.pipe(proxy, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`Cue web proxy running at http://localhost:${PROXY_PORT}`);
  console.log(`Forwarding to Metro at http://localhost:${METRO_PORT}`);
  console.log('COOP + COEP headers injected on every response.');
});
