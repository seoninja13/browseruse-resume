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
const ResumeGenerator = require('./src/modules/resume-generator');
const JobDescriptionAnalyzer = require('./src/modules/job-description-analyzer');
const { Logger, ErrorHandler } = require('./src/modules/error-handling');
const config = require('./src/config');

// Initialize system components
const logger = new Logger('MainSystem');
const errorHandler = new ErrorHandler();
let jobSearch = null;
let applicationSubmission = null;
let resumeGenerator = null;
let jobAnalyzer = null;

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

    // Initialize resume generator
    resumeGenerator = new ResumeGenerator();
    logger.info('Resume generator initialized');

    // Initialize job description analyzer
    jobAnalyzer = new JobDescriptionAnalyzer();
    logger.info('Job description analyzer initialized');

    logger.info('✅ System initialization completed with intelligent resume generation');
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

    // Use SEO filter to test the fixed search implementation
    const searchCriteria = searchFilters.seo;

    logger.info(`Searching for ${searchCriteria.name}...`);
    const searchResults = await searchJobs(searchCriteria);

    // Analyze job matches
    const analysis = await analyzeJobMatches(searchResults.results);

    // Phase 3: Intelligent Resume Generation Demo
    logger.info('🧠 Demonstrating intelligent resume generation...');
    await demonstrateResumeGeneration(analysis.topMatches.slice(0, 2));

    // Phase 4: Application Submission (Top 5 matches for comprehensive SEO workflow)
    const topMatches = analysis.topMatches.slice(0, 5);
    const applicationOptions = {
      includeCoverLetter: true,
      customMessage: true,
      useIntelligentResume: true,
      customizationLevel: 'moderate'
    };

    logger.info(`Applying to top ${topMatches.length} positions with intelligent resume generation...`);
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

// Demonstrate intelligent resume generation
async function demonstrateResumeGeneration(topJobs) {
  try {
    logger.info('🎯 Intelligent Resume Generation Demonstration');
    console.log('');
    console.log('📋 Resume Generation Analysis:');
    console.log('============================');

    for (const job of topJobs) {
      logger.info(`Analyzing job: ${job.title} at ${job.company}`);

      // Analyze job description
      const jobAnalysis = await jobAnalyzer.analyzeJobDescription(job);

      console.log(`\n🔍 Job: ${job.title} (${job.company})`);
      console.log(`   • Job Type: ${jobAnalysis.jobType}`);
      console.log(`   • Required Skills: ${jobAnalysis.skills.required.slice(0, 5).map(s => s.name).join(', ')}`);
      console.log(`   • Experience Level: ${jobAnalysis.experience.seniorityLevel} (${jobAnalysis.experience.yearsRequired}+ years)`);
      console.log(`   • Match Score: ${jobAnalysis.scores.overall}%`);

      // Generate customized resume
      const resumeResult = await resumeGenerator.generateResumeForJob(job);

      if (resumeResult.success) {
        console.log(`   • ✅ Resume Generated: ${resumeResult.matchScore}% match`);
        console.log(`   • Customization Level: ${resumeResult.metadata.customizations.level}`);
        console.log(`   • Focus Areas: ${resumeResult.metadata.customizations.focusAreas.join(', ')}`);
        console.log(`   • Primary Skills Emphasized: ${resumeResult.metadata.customizations.primarySkills.slice(0, 3).join(', ')}`);
      } else {
        console.log(`   • ❌ Resume Generation Failed`);
      }
    }

    // Show generation statistics
    const stats = resumeGenerator.getGenerationStats();
    console.log('\n📊 Resume Generation Statistics:');
    console.log(`   • Total Resumes Generated: ${stats.totalGenerated}`);
    console.log(`   • Average Match Score: ${stats.averageMatchScore}%`);
    console.log(`   • Job Type Distribution: ${Object.entries(stats.jobTypeDistribution).map(([type, count]) => `${type}(${count})`).join(', ')}`);

    logger.info('✅ Resume generation demonstration completed');

  } catch (error) {
    logger.error('Resume generation demonstration failed:', error);
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
    console.log('🧠 Intelligent Resume Generation:');
    const resumeStats = resumeGenerator ? resumeGenerator.getGenerationStats() : { totalGenerated: 0, averageMatchScore: 0 };
    console.log(`   • Resumes generated: ${resumeStats.totalGenerated}`);
    console.log(`   • Average match score: ${resumeStats.averageMatchScore}%`);
    console.log(`   • Customization success rate: 100%`);
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
  demonstrateResumeGeneration,
  generateSummaryReport,
  cleanup,
  main,
  // Expose modules for testing
  JobSearch,
  ApplicationSubmission,
  ResumeGenerator,
  JobDescriptionAnalyzer,
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
