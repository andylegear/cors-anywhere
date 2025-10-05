// Free proxy tester - finds working HTTP proxies
'use strict';

var http = require('http');
var url = require('url');

// Common free proxy IPs and ports (these change frequently)
var POTENTIAL_FREE_PROXIES = [
  // These are examples from public proxy lists - they may or may not work
  'http://103.149.162.194:80',
  'http://103.149.162.195:80',
  'http://185.38.111.1:8080',
  'http://188.166.234.144:8080',
  'http://194.67.91.153:80',
  'http://103.230.211.29:8080',
  'http://41.65.236.43:1981',
  'http://103.149.162.195:80',
  'http://185.38.111.1:8080',
  'http://194.67.91.153:80',
  // Elite proxies (higher anonymity)
  'http://103.149.162.194:80',
  'http://103.230.211.29:8080',
  'http://41.65.236.43:1981',
  // More potential working proxies
  'http://47.74.152.29:8888',
  'http://103.149.162.194:80',
  'http://185.38.111.1:8080',
];

/**
 * Test if a proxy is working by making a request through it
 * @param {string} proxyUrl - The proxy URL to test
 * @param {function} callback - Callback with (error, success)
 */
function testProxy(proxyUrl, callback) {
  var parsedProxy = url.parse(proxyUrl);
  var testUrl = 'http://httpbin.org/ip'; // Simple test endpoint
  
  var options = {
    hostname: parsedProxy.hostname,
    port: parsedProxy.port || 80,
    path: testUrl,
    method: 'GET',
    headers: {
      'Host': 'httpbin.org',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    timeout: 10000, // 10 second timeout
  };
  
  var req = http.request(options, function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    
    res.on('end', function() {
      try {
        var result = JSON.parse(data);
        if (result.origin && result.origin !== '78.152.205.216') {
          // Success - we got a different IP than our server's IP
          console.log('✓ Working proxy found: ' + proxyUrl + ' (IP: ' + result.origin + ')');
          callback(null, {proxy: proxyUrl, ip: result.origin});
        } else {
          console.log('✗ Proxy not masking IP: ' + proxyUrl);
          callback(new Error('Not masking IP'));
        }
      } catch (e) {
        console.log('✗ Invalid response from proxy: ' + proxyUrl);
        callback(new Error('Invalid response'));
      }
    });
  });
  
  req.on('error', function(err) {
    console.log('✗ Proxy connection failed: ' + proxyUrl + ' (' + err.message + ')');
    callback(err);
  });
  
  req.on('timeout', function() {
    console.log('✗ Proxy timeout: ' + proxyUrl);
    req.abort();
    callback(new Error('Timeout'));
  });
  
  req.end();
}

/**
 * Test multiple proxies and return working ones
 * @param {function} callback - Callback with working proxies array
 */
function findWorkingProxies(callback) {
  var workingProxies = [];
  var tested = 0;
  var total = POTENTIAL_FREE_PROXIES.length;
  
  console.log('Testing ' + total + ' potential free proxies...');
  
  POTENTIAL_FREE_PROXIES.forEach(function(proxy) {
    testProxy(proxy, function(err, result) {
      tested++;
      
      if (!err && result) {
        workingProxies.push(result);
      }
      
      if (tested === total) {
        console.log('\nTesting complete. Found ' + workingProxies.length + ' working proxies.');
        callback(workingProxies);
      }
    });
  });
}

// Export for use in other modules
module.exports = {
  testProxy: testProxy,
  findWorkingProxies: findWorkingProxies,
  POTENTIAL_FREE_PROXIES: POTENTIAL_FREE_PROXIES,
};

// If run directly, test proxies
if (require.main === module) {
  findWorkingProxies(function(workingProxies) {
    if (workingProxies.length > 0) {
      console.log('\n📋 Working proxies to use:');
      workingProxies.forEach(function(proxy) {
        console.log('  ' + proxy.proxy + ' (IP: ' + proxy.ip + ')');
      });
      console.log('\nTo use in your deployment, set environment variable:');
      console.log('PROXY_URL=' + workingProxies[0].proxy);
    } else {
      console.log('\n❌ No working free proxies found.');
      console.log('Recommendations:');
      console.log('1. Try a paid proxy service like ProxyMesh ($10/month)');
      console.log('2. Use Puppeteer for JavaScript challenge solving');
      console.log('3. Look for other free proxy lists online');
    }
  });
}
