#!/usr/bin/env node

/**
 * LinkedIn Browser Automation - Resume Submission System
 *
 * Main entry point for automated LinkedIn job search and application submission
 * using browsermcp MCP server for browser automation.
 *
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 1.0.0
 */

// Import modules
const JobSearch = require('./src/modules/job-search');
const ApplicationSubmission = require('./src/modules/application-submission');
const { Logger, ErrorHandler } = require('./src/modules/error-handling');
const config = require('./src/config');

// Initialize system components
const logger = new Logger('MainSystem');
const errorHandler = new ErrorHandler();
let jobSearch = null;
let applicationSubmission = null;

console.log('LinkedIn Browser Automation - Resume Submission System');
console.log('======================================================');
console.log('');
console.log('🚀 Initializing LinkedIn automation system...');
console.log('');

// Main automation functions
async function initializeSystem() {
  return errorHandler.handleWithRetry(async () => {
    logger.info('📡 Initializing automation system...');

    // Initialize job search module
    jobSearch = new JobSearch();
    await jobSearch.initialize();

    // Initialize application submission module
    applicationSubmission = new ApplicationSubmission();
    await applicationSubmission.initialize();

    logger.info('✅ System initialization completed');
    return { success: true };
  }, { operation: 'initializeSystem' });
}

async function searchJobs(searchCriteria = {}) {
  return errorHandler.handleWithRetry(async () => {
    logger.info('🔍 Starting job search...');

    if (!jobSearch) {
      throw new Error('Job search module not initialized');
    }

    const searchResults = await jobSearch.searchJobs(searchCriteria);
    logger.info(`✅ Found ${searchResults.resultsCount} job positions`);

    return searchResults;
  }, { operation: 'searchJobs', criteria: searchCriteria });
}

async function analyzeJobMatches(jobs = null) {
  return errorHandler.handleWithRetry(async () => {
    logger.info('📊 Analyzing job matches...');

    if (!jobSearch) {
      throw new Error('Job search module not initialized');
    }

    const analysis = await jobSearch.analyzeJobMatches(jobs);
    logger.info(`✅ Analysis completed. Average match score: ${analysis.averageMatch}%`);

    return analysis;
  }, { operation: 'analyzeJobMatches' });
}

async function submitApplications(selectedJobs, options = {}) {
  return errorHandler.handleWithRetry(async () => {
    logger.info(`📄 Submitting applications to ${selectedJobs.length} positions...`);

    if (!applicationSubmission) {
      throw new Error('Application submission module not initialized');
    }

    const results = [];

    for (const job of selectedJobs) {
      try {
        logger.info(`Applying to: ${job.title} at ${job.company}`);

        const result = await applicationSubmission.submitApplication(job, options);
        results.push(result);

        // Add delay between applications to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        logger.error(`Failed to apply to ${job.title}:`, error);
        results.push({
          success: false,
          job: job,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`✅ Applications completed: ${successCount}/${selectedJobs.length} successful`);

    return {
      success: true,
      totalApplications: selectedJobs.length,
      successfulApplications: successCount,
      results: results
    };
  }, { operation: 'submitApplications' });
}

// Main execution function
async function main() {
  try {
    logger.info('🎯 Starting LinkedIn automation workflow...');
    console.log('');

    // Phase 1: System Initialization
    await initializeSystem();

    // Phase 2: Job Search and Analysis
    const profileConfig = config.get('profile');
    const searchFilters = config.get('searchFilters');

    // Use SEO filter as default (based on our successful test)
    const searchCriteria = searchFilters.seo;

    logger.info(`Searching for ${searchCriteria.name}...`);
    const searchResults = await searchJobs(searchCriteria);

    // Analyze job matches
    const analysis = await analyzeJobMatches(searchResults.results);

    // Phase 3: Application Submission (Top 3 matches)
    const topMatches = analysis.topMatches.slice(0, 3);
    const applicationOptions = {
      includeCoverLetter: true,
      customMessage: true
    };

    logger.info(`Applying to top ${topMatches.length} positions...`);
    const applicationResults = await submitApplications(topMatches, applicationOptions);

    // Phase 4: Summary and Reporting
    await generateSummaryReport(searchResults, analysis, applicationResults);

    console.log('');
    console.log('🎉 LinkedIn automation workflow completed successfully!');
    console.log('');

  } catch (error) {
    logger.error('❌ Error in LinkedIn automation workflow:', error);
    console.error('Full error details:', error.stack);
    process.exit(1);
  } finally {
    // Cleanup resources
    await cleanup();
  }
}

// Generate summary report
async function generateSummaryReport(searchResults, analysis, applicationResults) {
  try {
    const profileConfig = config.get('profile');

    console.log('📊 Automation Summary Report');
    console.log('============================');
    console.log('');
    console.log(`👤 Profile: ${profileConfig.name} (${profileConfig.title})`);
    console.log(`📍 Location: ${profileConfig.location}`);
    console.log(`🎯 Experience: ${profileConfig.experience}`);
    console.log('');
    console.log('🔍 Search Results:');
    console.log(`   • Total positions found: ${searchResults.resultsCount}`);
    console.log(`   • Average match score: ${analysis.averageMatch}%`);
    console.log(`   • Top match: ${analysis.topMatches[0]?.title} (${analysis.topMatches[0]?.matchScore}%)`);
    console.log('');
    console.log('📄 Application Results:');
    console.log(`   • Applications submitted: ${applicationResults.successfulApplications}/${applicationResults.totalApplications}`);
    console.log(`   • Success rate: ${((applicationResults.successfulApplications / applicationResults.totalApplications) * 100).toFixed(1)}%`);
    console.log('');
    console.log('🔗 Project Links:');
    console.log('   • Linear Project: https://linear.app/1builder/issue/1BU-361');
    console.log('   • Repository: https://github.com/seoninja13/browseruse-resume.git');
    console.log('');
    console.log('📈 Next Steps:');
    console.log('   • Monitor application responses');
    console.log('   • Update resume templates based on feedback');
    console.log('   • Expand search criteria for additional opportunities');
    console.log('');

    logger.info('Summary report generated successfully');

  } catch (error) {
    logger.error('Failed to generate summary report:', error);
  }
}

// Cleanup function
async function cleanup() {
  try {
    logger.info('🧹 Cleaning up resources...');

    if (jobSearch) {
      await jobSearch.close();
    }

    if (applicationSubmission) {
      await applicationSubmission.close();
    }

    logger.info('✅ Cleanup completed');

  } catch (error) {
    logger.error('Error during cleanup:', error);
  }
}

// Export for testing
module.exports = {
  initializeSystem,
  searchJobs,
  analyzeJobMatches,
  submitApplications,
  generateSummaryReport,
  cleanup,
  main,
  // Expose modules for testing
  JobSearch,
  ApplicationSubmission,
  config,
  logger,
  errorHandler
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
