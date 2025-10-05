// Enhanced CORS Anywhere with Puppeteer support for Cloudflare-protected sites
'use strict';

var puppeteer = require('puppeteer');

// Environment variable to enable browser mode
var USE_BROWSER_MODE = process.env.USE_BROWSER_MODE === 'true';

var browser = null;

function initBrowser() {
  if (!USE_BROWSER_MODE) {
    return Promise.resolve(null);
  }
  
  if (browser) {
    return Promise.resolve(browser);
  }
  
  console.log('Initializing Puppeteer browser for Cloudflare bypass...');
  
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  }).then(function(browserInstance) {
    browser = browserInstance;
    console.log('Puppeteer browser initialized successfully');
    return browser;
  }).catch(function(error) {
    console.error('Failed to initialize Puppeteer browser:', error);
    throw error;
  });
}

function fetchWithBrowser(url) {
  return initBrowser().then(function(browserInstance) {
    if (!browserInstance) {
      throw new Error('Browser mode not enabled or failed to initialize');
    }
    
    console.log('Using Puppeteer to fetch: ' + url);
    
    return browserInstance.newPage().then(function(page) {
      // Set realistic viewport and user agent
      return page.setViewport({width: 1366, height: 768}).then(function() {
        var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                       '(KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
        return page.setUserAgent(userAgent);
      }).then(function() {
        // Navigate and wait for page to load
        console.log('Navigating to URL and waiting for challenges to resolve...');
        return page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: 60000, // Increased timeout for Cloudflare challenges
        });
      }).then(function() {
        // Wait for potential Cloudflare challenge to resolve
        console.log('Waiting for Cloudflare challenge resolution...');
        return page.waitForTimeout(10000); // Wait 10 seconds
      }).then(function() {
        // Check if we're still on a challenge page
        return page.evaluate(function() {
          // Browser globals available in page context
          var title = document.title;
          var body = document.body.innerHTML;
          return {
            title: title,
            isChallenge: title.includes('Just a moment') || 
                        body.includes('challenge') || 
                        body.includes('cf_chl_opt'),
            url: window.location.href,
          };
        });
      }).then(function(pageInfo) {
        if (pageInfo.isChallenge) {
          console.log('Still on challenge page, waiting longer...');
          return page.waitForTimeout(15000).then(function() {
            return page.content();
          });
        } else {
          console.log('Challenge resolved, getting content...');
          return page.content();
        }
      }).then(function(content) {
        return page.close().then(function() {
          return content;
        });
      }).catch(function(error) {
        console.error('Puppeteer page error:', error);
        return page.close().then(function() {
          throw error;
        });
      });
    });
  }).catch(function(error) {
    console.error('Puppeteer fetch error:', error);
    throw error;
  });
}

module.exports = {
  initBrowser: initBrowser,
  fetchWithBrowser: fetchWithBrowser,
  USE_BROWSER_MODE: USE_BROWSER_MODE,
};