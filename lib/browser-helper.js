// Enhanced CORS Anywhere with Puppeteer support for Cloudflare-protected sites
const puppeteer = require('puppeteer');

// Environment variable to enable browser mode
const USE_BROWSER_MODE = process.env.USE_BROWSER_MODE === 'true';

let browser = null;

async function initBrowser() {
  if (!browser && USE_BROWSER_MODE) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

async function fetchWithBrowser(url) {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  // Set realistic viewport and user agent
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36');
  
  try {
    // Navigate and wait for page to load
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a bit more for any potential challenges to resolve
    await page.waitForTimeout(5000);
    
    const content = await page.content();
    return content;
  } finally {
    await page.close();
  }
}

module.exports = {
  initBrowser,
  fetchWithBrowser,
  USE_BROWSER_MODE
};