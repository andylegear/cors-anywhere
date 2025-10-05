// Minimal CORS Anywhere server for Railway testing
var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

var cors_proxy = require('./lib/cors-anywhere');

var server = cors_proxy.createServer({
  originBlacklist: [],
  originWhitelist: [],
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: [
    'cookie',
    'cookie2',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
  },
});

server.listen(port, host, function() {
  console.log('Running minimal CORS Anywhere on ' + host + ':' + port);
});