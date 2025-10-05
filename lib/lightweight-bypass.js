// Lightweight Cloudflare bypass without Puppeteer
'use strict';

var http = require('http');
var https = require('https');
var url = require('url');

/**
 * Advanced HTTP client that mimics browser behavior more closely
 * @param {string} targetUrl - The URL to fetch
 * @param {Object} options - Request options
 * @returns {Promise} Promise that resolves with response
 */
function fetchWithAdvancedClient(targetUrl, options) {
  options = options || {};
  
  return new Promise(function(resolve, reject) {
    var parsedUrl = url.parse(targetUrl);
    var isHttps = parsedUrl.protocol === 'https:';
    var client = isHttps ? https : http;
    
    // Enhanced headers that better mimic a real browser
    var headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Connection': 'keep-alive',
      // Add some randomness to headers
      'DNT': Math.random() > 0.5 ? '1' : undefined,
    };
    
    // Remove undefined headers
    Object.keys(headers).forEach(function(key) {
      if (headers[key] === undefined) {
        delete headers[key];
      }
    });
    
    // Merge with custom headers
    if (options.headers) {
      Object.keys(options.headers).forEach(function(key) {
        headers[key] = options.headers[key];
      });
    }
    
    var requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: options.method || 'GET',
      headers: headers,
      timeout: options.timeout || 30000,
      // Add some realistic TCP settings
      keepAlive: true,
      keepAliveMsecs: 1000,
    };
    
    console.log('Making advanced HTTP request to:', targetUrl);
    
    var req = client.request(requestOptions, function(res) {
      var chunks = [];
      var responseSize = 0;
      
      res.on('data', function(chunk) {
        chunks.push(chunk);
        responseSize += chunk.length;
        
        // Prevent huge responses that might be attacks
        if (responseSize > 10 * 1024 * 1024) { // 10MB limit
          req.abort();
          reject(new Error('Response too large'));
          return;
        }
      });
      
      res.on('end', function() {
        var buffer = Buffer.concat(chunks);
        var content = buffer.toString('utf8');
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          content: content,
          contentLength: responseSize,
        });
      });
    });
    
    req.on('error', function(error) {
      console.error('Advanced HTTP client error:', error.message);
      reject(error);
    });
    
    req.on('timeout', function() {
      console.error('Advanced HTTP client timeout');
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    // Add realistic delay before sending request
    setTimeout(function() {
      req.end();
    }, Math.floor(Math.random() * 1000) + 500); // 500-1500ms delay
  });
}

/**
 * Multiple retry strategy with different approaches
 * @param {string} targetUrl - The URL to fetch
 * @returns {Promise} Promise that resolves with best response
 */
function fetchWithRetryStrategies(targetUrl) {
  var strategies = [
    // Strategy 1: Standard request
    function() {
      return fetchWithAdvancedClient(targetUrl);
    },
    
    // Strategy 2: With referrer
    function() {
      return fetchWithAdvancedClient(targetUrl, {
        headers: {
          'Referer': 'https://www.google.com/',
        },
      });
    },
    
    // Strategy 3: Mobile user agent
    function() {
      return fetchWithAdvancedClient(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Sec-Ch-Ua-Mobile': '?1',
        },
      });
    },
    
    // Strategy 4: Older browser
    function() {
      return fetchWithAdvancedClient(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        },
      });
    },
  ];
  
  function tryStrategy(index) {
    if (index >= strategies.length) {
      return Promise.reject(new Error('All strategies failed'));
    }
    
    console.log('Trying strategy', index + 1, 'of', strategies.length);
    
    return strategies[index]().then(function(response) {
      // Check if response looks like a challenge
      if (response.content && (
          response.content.includes('Just a moment') ||
          response.content.includes('challenge') ||
          response.content.includes('cf_chl_opt')
      )) {
        console.log('Strategy', index + 1, 'got challenge, trying next...');
        return tryStrategy(index + 1);
      }
      
      console.log('Strategy', index + 1, 'succeeded!');
      return response;
    }).catch(function(error) {
      console.log('Strategy', index + 1, 'failed:', error.message);
      return tryStrategy(index + 1);
    });
  }
  
  return tryStrategy(0);
}

module.exports = {
  fetchWithAdvancedClient: fetchWithAdvancedClient,
  fetchWithRetryStrategies: fetchWithRetryStrategies,
};