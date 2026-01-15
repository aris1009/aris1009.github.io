// Configure puppeteer to use system Chrome
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const { critical } = require('acclaimed');
const fs = require('fs');
const path = require('path');

async function buildCriticalCSS() {
  let serverProcess = null;
  try {
    // Start Eleventy dev server in background
    console.log('Starting Eleventy dev server...');
    const { spawn } = require('child_process');
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    // Wait for server to start (simple delay)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Run acclaimed critical CSS extraction
    console.log('Running acclaimed...');
    await critical();

    // Read the generated critical CSS file
    const config = require(path.resolve('.acclaimed.json'))[0];
    const criticalCssPath = config.out;

    // Wait for the file to be created (acclaimed has async issues)
    let attempts = 0;
    const maxAttempts = 20;
    while (!fs.existsSync(criticalCssPath) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;
      console.log(`Waiting for critical CSS file... (${attempts}/${maxAttempts})`);
    }

    if (!fs.existsSync(criticalCssPath)) {
      console.error('Critical CSS file not found after acclaimed processing');
      return '';
    }

    const criticalCss = fs.readFileSync(criticalCssPath, 'utf8');

    // Process CSS to remove newlines and extra whitespace for inline-ready output
    const processedCss = criticalCss
      .replace(/\n/g, '')  // Remove newlines
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .trim();  // Remove leading/trailing whitespace

    console.log('Critical CSS built successfully');
    return processedCss;

  } catch (error) {
    console.error('Error building critical CSS:', error.message);
    return '';
  } finally {
    // Stop the server
    if (serverProcess) {
      console.log('Stopping Eleventy dev server...');
      serverProcess.kill('SIGTERM');
    }
  }
}

// Export for use in Eleventy config
module.exports = { buildCriticalCSS };

// Allow running directly for testing
if (require.main === module) {
  buildCriticalCSS()
    .then(result => {
      console.log('Test completed. Critical CSS length:', result.length);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}