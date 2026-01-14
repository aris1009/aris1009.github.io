// Test script for web worker functionality
// Tests image processing and syntax highlighting workers

import { executeTask, terminateAllWorkers } from './worker-manager.js';

// Test image processing worker
async function testImageProcessing() {
  console.log('Testing image processing worker...');

  try {
    // Create a simple test image (1x1 pixel)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 1, 1);

    const imageData = canvas.toBlob();

    // Test resize operation
    const result = await executeTask('image-processor', 'resize', {
      imageData,
      width: 100,
      height: 100
    });

    console.log('Image processing test passed:', result);
    return true;
  } catch (error) {
    console.error('Image processing test failed:', error);
    return false;
  }
}

// Test syntax highlighting worker
async function testSyntaxHighlighting() {
  console.log('Testing syntax highlighting worker...');

  try {
    const code = 'function hello() { return "world"; }';
    const result = await executeTask('syntax-highlighter', 'highlight', {
      code,
      language: 'javascript'
    });

    console.log('Syntax highlighting test passed:', result);
    return true;
  } catch (error) {
    console.error('Syntax highlighting test failed:', error);
    return false;
  }
}

// Test analytics worker
async function testAnalyticsProcessing() {
  console.log('Testing analytics worker...');

  try {
    const events = [
      { type: 'pageview', timestamp: Date.now(), page: '/home', sessionId: '123' },
      { type: 'click', timestamp: Date.now(), page: '/home', sessionId: '123' }
    ];

    const result = await executeTask('analytics', 'aggregate', {
      events,
      timeframe: 3600 // 1 hour
    });

    console.log('Analytics test passed:', result);
    return true;
  } catch (error) {
    console.error('Analytics test failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting web worker tests...');

  const results = await Promise.all([
    testImageProcessing(),
    testSyntaxHighlighting(),
    testAnalyticsProcessing()
  ]);

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`Tests completed: ${passed}/${total} passed`);

  // Clean up
  terminateAllWorkers();

  return passed === total;
}

// Export for use in browser console or automated tests
window.testWebWorkers = runTests;

// Auto-run if this script is loaded directly
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Web worker tests loaded. Run testWebWorkers() to execute tests.');
  });
}

export { testImageProcessing, testSyntaxHighlighting, testAnalyticsProcessing, runTests };