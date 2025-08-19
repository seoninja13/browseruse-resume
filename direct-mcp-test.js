/**
 * Direct MCP Test - Test actual MCP functions
 */

console.log('🔧 Starting Direct MCP Test...');

async function testDirectMCP() {
  try {
    console.log('📋 Testing direct MCP function calls...');
    
    // Test if we can access the MCP functions directly
    console.log('Available MCP functions in environment:');
    console.log('- browser_navigate_browsermcp:', typeof browser_navigate_browsermcp);
    console.log('- browser_snapshot_browsermcp:', typeof browser_snapshot_browsermcp);
    console.log('- browser_click_browsermcp:', typeof browser_click_browsermcp);
    console.log('- browser_type_browsermcp:', typeof browser_type_browsermcp);
    console.log('- browser_screenshot_browsermcp:', typeof browser_screenshot_browsermcp);
    
    // Try to call navigation
    console.log('\n📋 Testing navigation...');
    const result = await browser_navigate_browsermcp('https://www.linkedin.com/jobs/');
    console.log('✅ Navigation result:', result);
    
  } catch (error) {
    console.error('❌ Direct MCP test failed:', error.message);
    
    if (error.message.includes('No connection to browser extension')) {
      console.log('\n🔧 BROWSER CONNECTION REQUIRED:');
      console.log('1. Open Chrome or Firefox');
      console.log('2. Install Browser MCP extension');
      console.log('3. Click extension icon and click "Connect"');
      console.log('4. Navigate to LinkedIn');
      console.log('5. Run test again');
    }
  }
}

testDirectMCP();
