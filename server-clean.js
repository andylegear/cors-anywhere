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

// Set up simple Cloudflare bypass for free tier
var simpleBypass = require('./lib/simple-bypass-v2');

var cors_proxy = require('./lib/cors-anywhere');

// Create server with basic CORS Anywhere configuration
var server = cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
});

// Intercept requests BEFORE they go to the proxy
server.on('request', function(req, res) {
  var url = req.url;
  
  // Check if this is an astrobuysell.com request
  if (url.includes('astrobuysell.com')) {
    // Extract target URL from CORS Anywhere path
    var targetUrl = url.substring(1); // Remove leading slash
    
    console.log('🎯 Intercepting Cloudflare request: ' + targetUrl);
    
    // Use simple bypass
    simpleBypass.bypassCloudflare(targetUrl, function(error, response) {
      if (error) {
        console.error('❌ Simple bypass failed:', error.message);
        return; // Let normal processing handle it
      }
      
      console.log('✅ Bypass successful, sending response');
      
      // Send response with CORS headers
      var responseHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Content-Type': response.headers['content-type'] || 'text/html',
      };
      
      res.writeHead(response.statusCode, responseHeaders);
      res.end(response.content);
    });
    
    // Important: Don't let the request continue to normal processing
    return;
  }
});

server.listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
  console.log('Simple Cloudflare bypass enabled for astrobuysell.com');
});
