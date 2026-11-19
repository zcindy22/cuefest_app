/**
 * web-proxy.js
 * A tiny reverse proxy that sits on port 8082 and forwards to Expo's Metro
 * dev server on port 8081, injecting the Cross-Origin headers required for
 * SharedArrayBuffer (expo-sqlite wasm) on every response.
 * Also injects a phone-frame CSS snippet into HTML responses so the app
 * renders at 390×844 (iPhone 14) centered on a gray background.
 *
 * Usage: node web-proxy.js
 * Then open http://localhost:8082 in the browser.
 */

const http = require('http');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;

const PHONE_FRAME_CSS = `
<style id="phone-frame">
  html, body { background-color: #888 !important; height: 100% !important; }
  body {
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important;
    overflow: auto !important;
    padding: 24px 0 !important;
    box-sizing: border-box !important;
  }
  #root {
    width: 390px !important;
    height: 844px !important;
    min-height: unset !important;
    flex: none !important;
    overflow: hidden !important;
    position: relative !important;
    background-color: #F0EFEA !important;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4) !important;
    border-radius: 44px !important;
  }
</style>`;

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

    const contentType = proxyRes.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html');

    if (isHtml) {
      // Buffer the HTML so we can inject the CSS snippet
      let body = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', chunk => { body += chunk; });
      proxyRes.on('end', () => {
        const injected = body.replace('</head>', PHONE_FRAME_CSS + '\n</head>');
        const headers = { ...proxyRes.headers, 'content-length': Buffer.byteLength(injected) };
        res.writeHead(proxyRes.statusCode, headers);
        res.end(injected);
      });
    } else {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
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
  console.log('COOP + COEP headers + phone frame injected on every response.');
});
