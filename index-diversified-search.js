#!/usr/bin/env node

/**
 * LinkedIn Diversified Search Strategy - Find 10 Unique Full Stack Positions
 *
 * Advanced automation system using multiple search configurations to find
 * exactly 10 unique Full Stack Developer positions with comprehensive
 * duplicate prevention and quality filtering.
 *
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 4.0.0
 */

const { JobSearch } = require('./src/modules/job-search');
const { ApplicationSubmission } = require('./src/modules/application-submission');
const { ResumeGenerator } = require('./src/modules/resume-generator');
const { JobDescriptionAnalyzer } = require('./src/modules/job-description-analyzer');
const { LinearIntegration } = require('./src/modules/linear-integration');
const { ErrorHandler, Logger } = require('./src/modules/error-handling');
const diversifiedStrategy = require('./config/diversified-search-strategy.json');

class DiversifiedLinkedInSearch {
  constructor() {
    this.logger = new Logger('DiversifiedSearch-MainSystem');
    this.errorHandler = new ErrorHandler();
    
    // Initialize modules
    this.jobSearch = null;
    this.applicationSubmission = null;
    this.resumeGenerator = null;
    this.jobAnalyzer = null;
    this.linearIntegration = null;
    
    // Load diversified search configurations
    this.searchConfigurations = diversifiedStrategy.diversifiedSearchConfigurations;
    this.duplicatePreventionDB = diversifiedStrategy.duplicatePreventionDatabase;
    this.searchStrategy = diversifiedStrategy.searchExecutionStrategy;
    this.qualityFilters = diversifiedStrategy.qualityFilters;
    
    // Tracking data
    this.allFoundJobs = [];
    this.uniqueJobs = [];
    this.duplicatesSkipped = [];
    this.searchResults = [];
    this.finalApplications = [];
    this.performanceMetrics = {
      startTime: null,
      endTime: null,
      searchesExecuted: 0,
      totalJobsFound: 0,
      uniqueJobsFound: 0,
      duplicatesSkipped: 0,
      targetApplications: 10,
      successfulApplications: 0
    };
  }

  /**
   * Initialize all system modules
   */
  async initializeSystem() {
    return this.errorHandler.executeWithRetry(async () => {
      this.logger.info('🤖 Initializing Diversified LinkedIn Search System...');
      
      // Initialize job search system
      this.jobSearch = new JobSearch();
      await this.jobSearch.initialize();
      this.logger.info('✅ Job search system initialized');
      
      // Initialize resume generator
      this.resumeGenerator = new ResumeGenerator();
      this.logger.info('Resume generator initialized');
      
      // Initialize job analyzer
      this.jobAnalyzer = new JobDescriptionAnalyzer();
      this.logger.info('Job description analyzer initialized');
      
      // Initialize application submission
      this.applicationSubmission = new ApplicationSubmission();
      await this.applicationSubmission.initialize();
      this.logger.info('✅ Application submission system initialized');
      
      // Initialize Linear integration
      this.linearIntegration = new LinearIntegration();
      await this.linearIntegration.initialize();
      this.logger.info('✅ Linear MCP integration initialized');
      
      this.logger.info('✅ Diversified search system initialization completed');
    }, 'initializeSystem');
  }

  /**
   * Execute diversified search strategy to find unique positions
   */
  async executeDiversifiedSearch() {
    return this.errorHandler.executeWithRetry(async () => {
      this.logger.info('🔍 Starting diversified search strategy for 10 unique Full Stack positions...');
      this.performanceMetrics.startTime = Date.now();
      
      for (let i = 0; i < this.searchConfigurations.length && this.uniqueJobs.length < this.searchStrategy.targetUniquePositions; i++) {
        const config = this.searchConfigurations[i];
        
        try {
          this.logger.info(`🔍 Executing search ${i + 1}/${this.searchConfigurations.length}: ${config.name}`);
          
          // Execute search with current configuration
          const searchResults = await this.jobSearch.searchJobs(config);
          this.performanceMetrics.searchesExecuted++;
          this.performanceMetrics.totalJobsFound += searchResults.length;
          
          this.logger.info(`✅ Found ${searchResults.length} positions for ${config.name}`);
          
          // Filter for unique positions
          const uniqueResults = this.filterUniquePositions(searchResults, config.id);
          this.logger.info(`📊 ${uniqueResults.length} unique positions after duplicate filtering`);
          
          // Add to unique jobs collection
          this.uniqueJobs = [...this.uniqueJobs, ...uniqueResults];
          
          // Store search results for analysis
          this.searchResults.push({
            configId: config.id,
            configName: config.name,
            totalFound: searchResults.length,
            uniqueFound: uniqueResults.length,
            duplicatesSkipped: searchResults.length - uniqueResults.length
          });
          
          this.logger.info(`📈 Progress: ${this.uniqueJobs.length}/${this.searchStrategy.targetUniquePositions} unique positions found`);
          
          // Break if we have enough unique positions
          if (this.uniqueJobs.length >= this.searchStrategy.targetUniquePositions) {
            this.logger.info(`🎯 Target reached: ${this.uniqueJobs.length} unique positions found`);
            break;
          }
          
          // Delay between searches to avoid rate limiting
          if (i < this.searchConfigurations.length - 1) {
            this.logger.info(`⏳ Waiting ${this.searchStrategy.delayBetweenSearches / 1000}s before next search...`);
            await this.wait(this.searchStrategy.delayBetweenSearches);
          }
          
        } catch (error) {
          this.logger.error(`Failed to execute search for ${config.name}:`, error);
          continue;
        }
      }
      
      this.performanceMetrics.uniqueJobsFound = this.uniqueJobs.length;
      this.logger.info(`✅ Diversified search completed. Found ${this.uniqueJobs.length} unique positions`);
      
      return this.uniqueJobs;
    }, 'executeDiversifiedSearch');
  }

  /**
   * Filter positions for uniqueness and quality
   */
  filterUniquePositions(jobs, searchConfigId) {
    const uniqueJobs = [];
    
    for (const job of jobs) {
      // Check against excluded URLs
      if (this.duplicatePreventionDB.excludedJobUrls.includes(job.url)) {
        this.duplicatesSkipped.push({
          reason: 'Excluded URL',
          job: `${job.title} at ${job.company}`,
          url: job.url,
          searchConfig: searchConfigId
        });
        this.performanceMetrics.duplicatesSkipped++;
        continue;
      }
      
      // Check against excluded company+position combinations
      const companyPosition = `${job.company}|${job.title}`;
      if (this.duplicatePreventionDB.excludedCompanyPositions.includes(companyPosition)) {
        this.duplicatesSkipped.push({
          reason: 'Excluded Company+Position',
          job: `${job.title} at ${job.company}`,
          combination: companyPosition,
          searchConfig: searchConfigId
        });
        this.performanceMetrics.duplicatesSkipped++;
        continue;
      }
      
      // Check for within-session duplicates
      const alreadyFound = this.uniqueJobs.some(existingJob => 
        existingJob.url === job.url || 
        `${existingJob.company}|${existingJob.title}` === companyPosition
      );
      
      if (alreadyFound) {
        this.duplicatesSkipped.push({
          reason: 'Within-session duplicate',
          job: `${job.title} at ${job.company}`,
          url: job.url,
          searchConfig: searchConfigId
        });
        this.performanceMetrics.duplicatesSkipped++;
        continue;
      }
      
      // Quality filtering for Full Stack positions
      if (!this.isFullStackPosition(job)) {
        this.duplicatesSkipped.push({
          reason: 'Not Full Stack position',
          job: `${job.title} at ${job.company}`,
          searchConfig: searchConfigId
        });
        continue;
      }
      
      // Add to unique jobs
      uniqueJobs.push({
        ...job,
        searchConfig: searchConfigId,
        foundAt: new Date().toISOString()
      });
      
      // Update exclusion database to prevent future duplicates
      this.duplicatePreventionDB.excludedJobUrls.push(job.url);
      this.duplicatePreventionDB.excludedCompanyPositions.push(companyPosition);
    }
    
    return uniqueJobs;
  }

  /**
   * Check if position is genuinely Full Stack
   */
  isFullStackPosition(job) {
    const jobText = (job.title + ' ' + job.description).toLowerCase();
    
    // Check for Full Stack keywords
    const hasFullStackKeywords = this.qualityFilters.fullStackKeywords.some(keyword => 
      jobText.includes(keyword.toLowerCase())
    );
    
    // Check for excluded keywords
    const hasExcludedKeywords = this.qualityFilters.excludeKeywords.some(keyword => 
      jobText.includes(keyword.toLowerCase())
    );
    
    // Check for required skills
    const hasRequiredSkills = this.qualityFilters.requiredSkillsAny.some(skill => 
      jobText.includes(skill.toLowerCase())
    );
    
    return hasFullStackKeywords && !hasExcludedKeywords && hasRequiredSkills;
  }

  /**
   * Analyze and select top 10 positions
   */
  async analyzeAndSelectTop10(jobs) {
    return this.errorHandler.executeWithRetry(async () => {
      this.logger.info('🧠 Analyzing job matches and selecting top 10 positions...');
      
      const analyzedJobs = [];
      
      for (const job of jobs) {
        const analysis = await this.jobAnalyzer.analyzeJob(job);
        
        // Enhanced scoring for full-stack positions
        let adjustedMatchScore = analysis.matchScore || 70;
        
        // Boost score for full-stack specific keywords
        const jobText = (job.title + ' ' + job.description).toLowerCase();
        const fullStackKeywordCount = this.qualityFilters.fullStackKeywords.filter(keyword => 
          jobText.includes(keyword.toLowerCase())
        ).length;
        
        adjustedMatchScore += (fullStackKeywordCount * 2); // 2% boost per keyword
        adjustedMatchScore = Math.min(adjustedMatchScore, 100);
        
        // Only include jobs meeting minimum match score
        if (adjustedMatchScore >= this.searchStrategy.minimumMatchScore) {
          analyzedJobs.push({
            ...job,
            analysis: {
              ...analysis,
              matchScore: adjustedMatchScore,
              fullStackKeywordCount,
              jobType: 'fullstack'
            }
          });
        }
      }
      
      // Sort by match score and take top 10
      const top10Jobs = analyzedJobs
        .sort((a, b) => b.analysis.matchScore - a.analysis.matchScore)
        .slice(0, 10);
      
      this.logger.info(`✅ Selected top ${top10Jobs.length} positions for application`);
      
      return top10Jobs;
    }, 'analyzeAndSelectTop10');
  }

  /**
   * Generate comprehensive summary report
   */
  generateDiversifiedSearchReport() {
    const duration = this.performanceMetrics.endTime - this.performanceMetrics.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n🔍 Diversified LinkedIn Search Summary Report');
    console.log('==============================================');
    console.log('');
    console.log('🎯 Search Strategy: Multi-Configuration Approach');
    console.log(`   • Search configurations executed: ${this.performanceMetrics.searchesExecuted}`);
    console.log(`   • Total positions found: ${this.performanceMetrics.totalJobsFound}`);
    console.log(`   • Unique positions identified: ${this.performanceMetrics.uniqueJobsFound}`);
    console.log(`   • Duplicates prevented: ${this.performanceMetrics.duplicatesSkipped}`);
    console.log(`   • Total execution time: ${minutes}m ${seconds}s`);
    console.log('');
    console.log('📊 Search Configuration Results:');
    this.searchResults.forEach(result => {
      console.log(`   • ${result.configName}: ${result.uniqueFound}/${result.totalFound} unique`);
    });
    console.log('');
    console.log('🛡️ Duplicate Prevention:');
    console.log(`   • Previous applications excluded: ${this.duplicatePreventionDB.excludedJobUrls.length}`);
    console.log(`   • Real-time duplicates prevented: ${this.duplicatesSkipped.length}`);
    console.log('');
    console.log('🎉 Diversified search strategy completed successfully!');
  }

  /**
   * Wait utility function
   */
  async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.logger.info('🧹 Cleaning up diversified search resources...');
    
    if (this.jobSearch) {
      await this.jobSearch.close();
    }
    
    if (this.applicationSubmission) {
      await this.applicationSubmission.close();
    }
    
    if (this.linearIntegration) {
      await this.linearIntegration.close();
    }
    
    this.logger.info('✅ Cleanup completed');
  }
}

/**
 * Main execution function
 */
async function main() {
  const diversifiedSearch = new DiversifiedLinkedInSearch();
  
  try {
    console.log('🔍 Initializing Diversified LinkedIn Search Strategy...');
    console.log('Target: Find exactly 10 unique Full Stack Developer positions');
    console.log('');
    
    // Initialize system
    await diversifiedSearch.initializeSystem();
    
    // Execute diversified search strategy
    const uniqueJobs = await diversifiedSearch.executeDiversifiedSearch();
    
    if (uniqueJobs.length === 0) {
      console.log('❌ No unique Full Stack positions found. All search configurations returned duplicates or no results.');
      return;
    }
    
    // Analyze and select top 10 positions
    const top10Jobs = await diversifiedSearch.analyzeAndSelectTop10(uniqueJobs);
    
    if (top10Jobs.length < 10) {
      console.log(`⚠️ Only ${top10Jobs.length} qualified positions found meeting criteria.`);
    }
    
    console.log(`🎯 Ready to proceed with ${top10Jobs.length} unique Full Stack Developer positions`);
    
    // Set end time for metrics
    diversifiedSearch.performanceMetrics.endTime = Date.now();
    
    // Generate summary report
    diversifiedSearch.generateDiversifiedSearchReport();
    
    // TODO: Implement application submission for the unique positions
    console.log('\n📋 Next Step: Execute applications to these unique positions');
    
  } catch (error) {
    console.error('❌ Diversified search strategy failed:', error);
    process.exit(1);
  } finally {
    await diversifiedSearch.cleanup();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DiversifiedLinkedInSearch };
