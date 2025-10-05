// Simple but effective Cloudflare bypass for free hosting
'use strict';

var http = require('http');
var https = require('https');
var url = require('url');

/**
 * Simple strategy: Use multiple user agents and retry logic
 */
function bypassCloudflare(targetUrl, callback) {
  var userAgents = [
    // Chrome Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

    // Firefox Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',

    // Safari macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.0 Safari/605.1.15',

    // Mobile Safari
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ];

  function makeRequest(userAgent, attempt, done) {
    var parsedUrl = url.parse(targetUrl);
    var isHttps = parsedUrl.protocol === 'https:';
    var client = isHttps ? https : http;

    var headers = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // Add referrer for non-first attempts
    if (attempt > 0) {
      headers['Referer'] = 'https://www.google.com/';
    }

    var options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      headers: headers,
      timeout: 20000,
    };

    console.log('Attempt', attempt + 1, 'with User-Agent:', userAgent.substring(0, 50) + '...');

    var req = client.request(options, function(res) {
      var data = '';

      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        done(null, {
          statusCode: res.statusCode,
          headers: res.headers,
          content: data,
        });
      });
    });

    req.on('error', function(error) {
      done(error);
    });

    req.on('timeout', function() {
      req.abort();
      done(new Error('Timeout'));
    });

    req.end();
  }

  function tryAllUserAgents(index) {
    if (index >= userAgents.length) {
      return callback(new Error('All user agents failed'));
    }

    makeRequest(userAgents[index], index, function(error, response) {
      if (error) {
        console.log('Request failed:', error.message);
        if (index < userAgents.length - 1) {
          return tryAllUserAgents(index + 1);
        }
        return callback(error);
      }

      // Check if we got a challenge
      var isChallenge = response.content.includes('Just a moment') ||
                       response.content.includes('challenge') ||
                       response.content.includes('cf_chl_opt') ||
                       response.statusCode === 403;

      if (isChallenge && index < userAgents.length - 1) {
        console.log('Got challenge, trying next user agent...');
        // Add delay between attempts
        setTimeout(function() {
          tryAllUserAgents(index + 1);
        }, 2000 + Math.random() * 3000); // 2-5 second delay
      } else {
        callback(null, response);
      }
    });
  }

  tryAllUserAgents(0);
}

module.exports = {
  bypassCloudflare: bypassCloudflare,
};