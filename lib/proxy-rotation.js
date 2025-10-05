// Simple proxy rotation for bypassing IP-based restrictions
'use strict';

// Free public proxies (these change frequently, may not always work)
var FREE_PROXIES = [
  'http://180.183.157.159:8080',   // User provided proxy
  'http://180.183.157.159:3128',   // Common proxy ports
  'http://180.183.157.159:80',
];

// Alternative: Use proxy for testing
var USE_PROXY_FOR_TESTING = true;

// Paid proxy services (examples - you would need to sign up)
var PAID_PROXY_SERVICES = {
  // Example: Bright Data (formerly Luminati)
  brightdata: {
    endpoint: 'http://brd-customer-{customer}-zone-{zone}:{port}@brd.superproxy.io:{port}',
    // You would replace {customer}, {zone}, {port} with your actual credentials
  },
  
  // Example: ProxyMesh
  proxymesh: {
    endpoints: [
      'http://username:password@us-wa.proxymesh.com:31280',
      'http://username:password@us-ca.proxymesh.com:31280',
      'http://username:password@us-il.proxymesh.com:31280',
    ],
  },
  
  // Example: SmartProxy
  smartproxy: {
    endpoint: 'http://username:password@gate.smartproxy.com:10000',
  },
};

var currentProxyIndex = 0;

/**
 * Get the next proxy URL in rotation
 * @param {string} targetUrl - The URL being requested (for geo-targeting)
 * @returns {string|null} - Proxy URL or null if no proxy should be used
 */
function getNextProxy(targetUrl) {
  // For testing, let's use environment variables to configure proxy
  var proxyUrl = process.env.PROXY_URL;
  if (proxyUrl) {
    console.log('Using configured proxy: ' + proxyUrl);
    return proxyUrl;
  }
  
  // If targeting Cloudflare-protected sites, use proxy
  if (targetUrl && isCloudflareProtected(targetUrl)) {
    console.log('Detected Cloudflare-protected site: ' + targetUrl);
    
    // Use proxy if we have working ones available
    if (USE_PROXY_FOR_TESTING && FREE_PROXIES.length > 0) {
      var proxy = FREE_PROXIES[currentProxyIndex % FREE_PROXIES.length];
      currentProxyIndex++;
      console.log('Attempting to use proxy for Cloudflare bypass: ' + proxy);
      console.log('Note: If you see connection errors, the proxy may not be available or require authentication');
      return proxy;
    } else {
      console.log('To enable proxy routing, set PROXY_URL environment variable');
    }
  }
  
  return null; // No proxy
}

/**
 * Check if a URL is likely Cloudflare protected
 * @param {string} url - The target URL
 * @returns {boolean}
 */
function isCloudflareProtected(url) {
  var protectedDomains = [
    'astrobuysell.com',
    // Add other known Cloudflare-protected domains
  ];
  
  return protectedDomains.some(function(domain) {
    return url.includes(domain);
  });
}

/**
 * Configure proxy credentials if using paid services
 * @param {Object} config - Proxy configuration
 */
function configureProxyCredentials(config) {
  if (config.service === 'brightdata') {
    return PAID_PROXY_SERVICES.brightdata.endpoint
      .replace('{customer}', config.customer)
      .replace('{zone}', config.zone)
      .replace('{port}', config.port);
  }
  
  if (config.service === 'proxymesh') {
    var endpoints = PAID_PROXY_SERVICES.proxymesh.endpoints;
    return endpoints[Math.floor(Math.random() * endpoints.length)]
      .replace('username:password', config.username + ':' + config.password);
  }
  
  if (config.service === 'smartproxy') {
    return PAID_PROXY_SERVICES.smartproxy.endpoint
      .replace('username:password', config.username + ':' + config.password);
  }
  
  return null;
}

module.exports = {
  getNextProxy: getNextProxy,
  configureProxyCredentials: configureProxyCredentials,
  isCloudflareProtected: isCloudflareProtected,
};