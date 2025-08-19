#!/usr/bin/env node

/**
 * Debug LinkedIn Search Implementation
 * 
 * This script will help us understand why the search is returning only 3 mock results
 * instead of the 213 real results available on LinkedIn.
 */

const { JobSearch } = require('./src/modules/job-search');
const { BrowserAutomation } = require('./src/modules/browser-automation');
const searchFilters = require('./config/search-filters.json');

class SearchDebugger {
  constructor() {
    this.browser = null;
    this.jobSearch = null;
  }

  async initialize() {
    console.log('🔍 Initializing Search Debugger...');
    
    // Initialize browser automation
    this.browser = new BrowserAutomation();
    await this.browser.initialize();
    
    // Initialize job search
    this.jobSearch = new JobSearch();
    await this.jobSearch.initialize();
    
    console.log('✅ Search Debugger initialized');
  }

  async debugLinkedInSearch() {
    try {
      console.log('\n🔍 DEBUGGING LINKEDIN SEARCH IMPLEMENTATION');
      console.log('===========================================');
      
      // Use SEO search criteria
      const searchCriteria = searchFilters.seo;
      console.log('\n📋 Search Criteria:');
      console.log(JSON.stringify(searchCriteria, null, 2));
      
      // Step 1: Navigate to LinkedIn Jobs
      console.log('\n🌐 Step 1: Navigating to LinkedIn Jobs...');
      await this.browser.navigate('https://www.linkedin.com/jobs/');
      console.log('✅ Navigation completed');
      
      // Step 2: Apply search filters manually to debug
      console.log('\n🔧 Step 2: Applying search filters...');
      
      // Enter keywords
      if (searchCriteria.keywords && searchCriteria.keywords.length > 0) {
        const keywordString = Array.isArray(searchCriteria.keywords) 
          ? searchCriteria.keywords.join(' OR ') 
          : searchCriteria.keywords;
        
        console.log(`📝 Entering keywords: "${keywordString}"`);
        await this.browser.type('input[aria-label*="Search by title"]', keywordString);
      }
      
      // Enter location
      if (searchCriteria.location) {
        console.log(`📍 Entering location: "${searchCriteria.location}"`);
        await this.browser.type('input[aria-label*="City, state"]', searchCriteria.location);
      }
      
      // Step 3: Execute search
      console.log('\n🔍 Step 3: Executing search...');
      await this.browser.click('button[aria-label="Search"]');
      await this.browser.wait(5000); // Wait for results to load
      console.log('✅ Search executed');
      
      // Step 4: Capture page snapshot for analysis
      console.log('\n📸 Step 4: Capturing page snapshot...');
      const snapshot = await this.browser.getPageSnapshot();
      
      // Step 5: Analyze the snapshot
      console.log('\n🔍 Step 5: Analyzing search results...');
      this.analyzeSearchResults(snapshot);
      
      // Step 6: Try to extract actual job URLs
      console.log('\n🔗 Step 6: Extracting job URLs...');
      const jobUrls = this.extractJobUrls(snapshot);
      console.log(`Found ${jobUrls.length} job URLs:`);
      jobUrls.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
      
      // Step 7: Check if we can find Easy Apply buttons
      console.log('\n✅ Step 7: Checking for Easy Apply availability...');
      const easyApplyCount = this.countEasyApplyJobs(snapshot);
      console.log(`Found ${easyApplyCount} jobs with Easy Apply`);
      
    } catch (error) {
      console.error('❌ Debug search failed:', error);
    }
  }

  analyzeSearchResults(snapshot) {
    if (!snapshot || !snapshot.text) {
      console.log('❌ No snapshot text available');
      return;
    }
    
    const text = snapshot.text.toLowerCase();
    
    // Check if we're on the right page
    console.log('\n📊 Page Analysis:');
    console.log(`   • Contains "jobs": ${text.includes('jobs')}`);
    console.log(`   • Contains "results": ${text.includes('results')}`);
    console.log(`   • Contains "easy apply": ${text.includes('easy apply')}`);
    console.log(`   • Contains "seo": ${text.includes('seo')}`);
    console.log(`   • Contains "search engine": ${text.includes('search engine')}`);
    
    // Count potential job listings
    const jobKeywords = ['engineer', 'manager', 'specialist', 'analyst', 'director', 'developer'];
    let jobCount = 0;
    jobKeywords.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
      jobCount += matches;
      console.log(`   • Contains "${keyword}": ${matches} times`);
    });
    
    console.log(`   • Estimated job mentions: ${jobCount}`);
    
    // Check for pagination
    console.log(`   • Contains "next": ${text.includes('next')}`);
    console.log(`   • Contains "page": ${text.includes('page')}`);
    
    // Sample of the text content
    console.log('\n📝 Sample page content (first 500 characters):');
    console.log(snapshot.text.substring(0, 500) + '...');
  }

  extractJobUrls(snapshot) {
    const urls = [];
    
    if (snapshot && snapshot.text) {
      // Look for LinkedIn job URLs in the text
      const urlRegex = /https:\/\/www\.linkedin\.com\/jobs\/view\/\d+/g;
      const matches = snapshot.text.match(urlRegex);
      
      if (matches) {
        // Remove duplicates
        const uniqueUrls = [...new Set(matches)];
        urls.push(...uniqueUrls);
      }
    }
    
    return urls;
  }

  countEasyApplyJobs(snapshot) {
    if (!snapshot || !snapshot.text) {
      return 0;
    }
    
    const text = snapshot.text.toLowerCase();
    const easyApplyMatches = (text.match(/easy apply/g) || []).length;
    return easyApplyMatches;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.jobSearch) {
      await this.jobSearch.close();
    }
    
    console.log('✅ Cleanup completed');
  }
}

async function main() {
  const debugger = new SearchDebugger();
  
  try {
    await debugger.initialize();
    await debugger.debugLinkedInSearch();
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await debugger.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SearchDebugger };
