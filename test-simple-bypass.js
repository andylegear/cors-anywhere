// Test script for the simple Cloudflare bypass
'use strict';

var simpleBypass = require('./lib/simple-bypass-v2');

console.log('Testing simple Cloudflare bypass...');

// Test with astrobuysell.com
var testUrl = 'https://astrobuysell.com';

console.log('Attempting to bypass Cloudflare protection for:', testUrl);

simpleBypass.bypassCloudflare(testUrl, function(error, response) {
  if (error) {
    console.error('Bypass failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n🎉 Bypass successful!');
  console.log('Status Code:', response.statusCode);
  console.log('Content Length:', response.content.length);
  
  // Simple check - if we have a 200 status and substantial content with HTML, we succeeded
  if (response.statusCode === 200 && response.content.length > 1000 &&
      (response.content.includes('<html') || response.content.includes('<HTML'))) {
    console.log('✅ Successfully bypassed Cloudflare protection!');
  } else if (response.statusCode === 403 || response.statusCode === 503 ||
            response.content.includes('Just a moment') ||
            response.content.includes('Checking your browser')) {
    console.log('⚠️  Still getting Cloudflare challenge');
  } else {
    console.log('🤔 Got response but unsure if challenge or real content');
  }
  
  // Show first 500 characters of response
  console.log('\nFirst 500 characters of response:');
  console.log('─'.repeat(50));
  console.log(response.content.substring(0, 500));
  console.log('─'.repeat(50));
  
  process.exit(0);
});
