// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// Set up proxy rotation for IP masking
var proxyRotation = require('./lib/proxy-rotation');

// Set up Cloudflare bypass handler
var cloudflareHandler = require('./lib/cloudflare-handler');

var cors_proxy = require('./lib/cors-anywhere');
var cors_proxy = require('./lib/cors-anywhere');

// Create custom server with Puppeteer support
var server = cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  setHeaders: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/118.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,' +
              'image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
  },
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
  // Custom proxy function for IP rotation
  getProxyForUrl: function(url) {
    return proxyRotation.getNextProxy(url);
  },
});

// Add custom middleware to intercept Cloudflare-protected requests
var originalListen = server.listen;
server.listen = function(port, host, callback) {
  // Add request interceptor for Puppeteer handling
  server.on('request', function(req, res) {
    var url = req.url;
    
    // Extract target URL from CORS Anywhere path
    if (url.startsWith('/http://') || url.startsWith('/https://')) {
      var targetUrl = url.substring(1); // Remove leading slash
      
      // Check if this should use Puppeteer
      if (cloudflareHandler.shouldUsePuppeteer(targetUrl)) {
        console.log('Intercepting Cloudflare request for Puppeteer handling: ' + targetUrl);
        cloudflareHandler.handleCloudflareRequest(req, res, targetUrl);
        return; // Don't continue to normal processing
      }
    }
  });
  
  // Call original listen method
  return originalListen.call(this, port, host, callback);
};

server.listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
  if (process.env.USE_BROWSER_MODE === 'true') {
    console.log('Puppeteer mode enabled for Cloudflare bypass');
  }
});
