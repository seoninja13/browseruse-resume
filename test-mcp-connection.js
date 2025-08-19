/**
 * Test MCP Connection to browsermcp server
 * 
 * This script tests the direct connection to the browsermcp MCP server
 * to verify that real browser automation is working.
 */

async function testMCPConnection() {
  console.log('🔧 Testing MCP Connection to browsermcp server...');
  
  try {
    // Test 1: Try to navigate to LinkedIn
    console.log('\n📋 Test 1: Navigation to LinkedIn');

    // Use the MCP integration client
    const { use_tool_toolbox } = require('./mcp-integration/toolbox-client');

    const navResult = await use_tool_toolbox('browsermcp', {
      name: 'browser_navigate_browsermcp',
      arguments: { url: 'https://www.linkedin.com/jobs/' }
    });
    console.log('✅ Navigation successful:', navResult);

    // Test 2: Try to take a page snapshot
    console.log('\n📋 Test 2: Page Snapshot');
    const snapshot = await use_tool_toolbox('browsermcp', {
      name: 'browser_snapshot_browsermcp',
      arguments: {}
    });
    console.log('✅ Snapshot successful:', snapshot ? 'Data received' : 'No data');

    // Test 3: Try to take a screenshot
    console.log('\n📋 Test 3: Screenshot');
    const screenshot = await use_tool_toolbox('browsermcp', {
      name: 'browser_screenshot_browsermcp',
      arguments: {}
    });
    console.log('✅ Screenshot successful:', screenshot);
    
    console.log('\n🎉 All MCP tests passed! Real browser automation is working.');
    
  } catch (error) {
    console.error('\n❌ MCP Connection Test Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('No connection to browser extension')) {
      console.log('\n🔧 SOLUTION REQUIRED:');
      console.log('1. Open a browser (Chrome/Firefox)');
      console.log('2. Install the Browser MCP extension');
      console.log('3. Click the extension icon and click "Connect"');
      console.log('4. Navigate to LinkedIn in the connected tab');
      console.log('5. Run this test again');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testMCPConnection()
    .then(() => {
      console.log('\n✅ MCP Connection test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ MCP Connection test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMCPConnection };
