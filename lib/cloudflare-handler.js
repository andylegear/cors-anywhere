// Cloudflare bypass handler using Puppeteer
'use strict';

var browserHelper = require('./browser-helper');
var url = require('url');

/**
 * Handle Cloudflare-protected requests using Puppeteer
 * @param {Object} req - The incoming request
 * @param {Object} res - The response object
 * @param {string} targetUrl - The URL to fetch
 */
function handleCloudflareRequest(req, res, targetUrl) {
  console.log('Handling Cloudflare-protected request with Puppeteer: ' + targetUrl);
  
  // Set CORS headers immediately
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 
               'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  browserHelper.fetchWithBrowser(targetUrl).then(function(content) {
    console.log('Successfully fetched content with Puppeteer (length: ' + content.length + ')');
    
    // Check if we still got a challenge page
    if (content.includes('Just a moment') || content.includes('challenge')) {
      console.log('Warning: Still appears to be a challenge page');
    }
    
    // Parse the original URL to get host info
    var parsedUrl = url.parse(targetUrl);
    
    // Set response headers to mimic the original response
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('X-Powered-By', 'CORS Anywhere + Puppeteer');
    res.setHeader('X-Original-Host', parsedUrl.host);
    
    res.writeHead(200);
    res.end(content);
    
  }).catch(function(error) {
    console.error('Puppeteer fetch failed:', error);
    
    // Fallback to error response
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(500);
    res.end(JSON.stringify({
      error: 'Puppeteer fetch failed',
      message: error.message,
      url: targetUrl,
    }));
  });
}

/**
 * Check if a request should be handled by Puppeteer
 * @param {string} targetUrl - The target URL
 * @returns {boolean}
 */
function shouldUsePuppeteer(targetUrl) {
  if (!browserHelper.USE_BROWSER_MODE) {
    return false;
  }
  
  var protectedDomains = [
    'astrobuysell.com',
    'cloudflare.com',
    // Add other known Cloudflare-protected domains
  ];
  
  return protectedDomains.some(function(domain) {
    return targetUrl.includes(domain);
  });
}

module.exports = {
  handleCloudflareRequest: handleCloudflareRequest,
  shouldUsePuppeteer: shouldUsePuppeteer,
};