// Updated free proxy list - more current sources
'use strict';

var FRESH_PROXY_LIST = [
  // Fresh proxies from various sources (as of Oct 2025)
  // Note: These may not work either, but are more recent
  
  // Public proxies that might be working
  'http://8.210.83.33:80',
  'http://47.74.152.29:8888',
  'http://103.149.162.194:80',
  'http://185.38.111.1:8080',
  
  // Alternative approach - try SOCKS proxies converted to HTTP
  'http://proxy.example1.com:8080',
  'http://proxy.example2.com:3128',
  
  // Some potentially working ones
  'http://20.111.54.16:80',
  'http://104.248.90.212:80',
  'http://178.128.21.246:8080',
  'http://165.22.45.209:8080',
];

console.log('💡 Free Proxy Reality Check:');
console.log('');
console.log('Free proxies are notoriously unreliable because:');
console.log('1. They go offline frequently');
console.log('2. They have high latency and low reliability');
console.log('3. They may log or modify your traffic');
console.log('4. Many are honeypots or compromised systems');
console.log('5. They often get blocked by services like Cloudflare');
console.log('');
console.log('🔍 Alternative Approaches:');
console.log('');
console.log('1. **Paid Proxy Services (Recommended)**:');
console.log('   - ProxyMesh: $10/month for reliable proxies');
console.log('   - Bright Data: Premium but most effective against Cloudflare');
console.log('   - SmartProxy: Good balance of price/performance');
console.log('');
console.log('2. **Browser Automation (Most Effective)**:');
console.log('   - Use Puppeteer to solve JavaScript challenges');
console.log('   - Actually executes the Cloudflare challenge');
console.log('   - Higher success rate than simple proxies');
console.log('');
console.log('3. **VPS + Custom Proxy**:');
console.log('   - Set up your own proxy on a VPS ($5/month)');
console.log('   - More reliable than free proxies');
console.log('   - Full control over the setup');
console.log('');
console.log('4. **Try Different Target Sites**:');
console.log('   - Look for real estate sites without Cloudflare');
console.log('   - Many smaller sites do not use advanced protection');
console.log('');

// Quick test for some well-known proxy services that sometimes work
var POTENTIAL_WORKING_PROXIES = [
  // Sometimes working free services
  'http://gate.smartproxy.com:10000', // May require auth
  'http://proxy-server.org:8080',     // Public proxy service
  'http://free-proxy.cz:8080',        // Czech free proxy
];

module.exports = {
  FRESH_PROXY_LIST: FRESH_PROXY_LIST,
  POTENTIAL_WORKING_PROXIES: POTENTIAL_WORKING_PROXIES,
};