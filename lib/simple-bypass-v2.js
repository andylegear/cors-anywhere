// Simple but effective Cloudflare bypass for free hosting
'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
var zlib = require('zlib');

/**
 * Simple strategy: Use multiple user agents and retry logic
 */
function bypassCloudflare(targetUrl, callback) {
  var userAgents = [
    // Edge Windows - most successful at bypassing Cloudflare in recent tests
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',

    // Mobile Safari iOS 17 - often bypasses mobile-specific protection
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',

    // Safari macOS latest - desktop WebKit
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.0 Safari/605.1.15',

    // Mobile Safari iOS 16 - slightly older version
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',

    // Firefox Windows - Gecko engine
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',

    // Chrome Windows - Blink engine (fallback)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      var chunks = [];

      res.on('data', function(chunk) {
        chunks.push(chunk);
      });

      res.on('end', function() {
        var buffer = Buffer.concat(chunks);
        var encoding = res.headers['content-encoding'];
        
        function processContent(content) {
          done(null, {
            statusCode: res.statusCode,
            headers: res.headers,
            content: content,
          });
        }
        
        // Handle compressed content
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, function(err, decoded) {
            if (err) {
              return done(err);
            }
            processContent(decoded.toString());
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, function(err, decoded) {
            if (err) {
              return done(err);
            }
            processContent(decoded.toString());
          });
        } else if (encoding === 'br') {
          // Brotli compression - Node.js has built-in support
          zlib.brotliDecompress(buffer, function(err, decoded) {
            if (err) {
              return done(err);
            }
            processContent(decoded.toString());
          });
        } else {
          processContent(buffer.toString());
        }
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

      // Check if we got a challenge (improved detection to avoid false positives)
      var isChallenge = response.statusCode === 403 ||
                       response.statusCode === 503 ||
                       response.content.includes('Just a moment') ||
                       response.content.includes('Checking your browser') ||
                       response.content.includes('Please wait while your request is being verified') ||
                       response.content.includes('cf_chl_opt') ||
                       response.content.includes('cf-challenge');

      if (isChallenge && index < userAgents.length - 1) {
        console.log('Got challenge, trying next user agent...');
        // Add delay between attempts
        setTimeout(function() {
          tryAllUserAgents(index + 1);
        }, 2000 + Math.random() * 3000); // 2-5 second delay
      } else {
        // Check if this looks like real content vs challenge page
        var hasRealContent = response.content.length > 1000 &&
                           !response.content.includes('Just a moment') &&
                           !response.content.includes('Checking your browser') &&
                           (response.content.includes('<html') || response.content.includes('<HTML'));

        if (hasRealContent) {
          console.log('✅ Successfully got real content! (Length: ' + response.content.length + ')');
        } else if (response.content.length < 1000) {
          console.log('⚠️  Got short response, might be challenge or error page');
        }

        callback(null, response);
      }
    });
  }

  tryAllUserAgents(0);
}

module.exports = {
  bypassCloudflare: bypassCloudflare,
};
