/**
 * Autonomous Application Engine
 * Integrates resume customization with proven autonomous LinkedIn workflow
 * Maintains 15-second processing speed while adding intelligent customization
 */

const JobDescriptionAnalyzer = require('./job-description-analyzer');
const DynamicResumeGenerator = require('./dynamic-resume-generator');
const ResumeJobMatcher = require('./resume-job-matcher');
const ApplicationTracker = require('./application-tracker');
const fs = require('fs');
const path = require('path');

class AutonomousApplicationEngine {
    constructor(linearClient, browsermcpClient) {
        this.jobAnalyzer = new JobDescriptionAnalyzer();
        this.resumeGenerator = new DynamicResumeGenerator();
        this.jobMatcher = new ResumeJobMatcher();
        this.applicationTracker = new ApplicationTracker(linearClient);
        this.browsermcpClient = browsermcpClient;
        
        this.performanceTargets = {
            maxProcessingTime: 15, // seconds
            minMatchScore: 80,     // percentage
            targetMatchScore: 90   // percentage
        };
        
        this.resumeOutputPath = path.join(__dirname, '../../generated-resumes');
        this.ensureResumeDirectory();
    }

    /**
     * Execute complete autonomous job application with resume customization
     * @param {Object} jobData - Job information from LinkedIn
     * @returns {Object} Application result with comprehensive tracking
     */
    async executeAutonomousApplication(jobData) {
        const startTime = Date.now();
        console.log(`🚀 Starting autonomous application for ${jobData.title} at ${jobData.company}`);

        try {
            // Phase 1: Job Description Analysis (Target: <2 seconds)
            console.log('📊 Phase 1: Analyzing job description...');
            const jobAnalysis = await this.analyzeJobDescription(jobData);
            
            // Phase 2: Dynamic Resume Generation (Target: <5 seconds)
            console.log('📄 Phase 2: Generating customized resume...');
            const resumeResult = await this.generateCustomizedResume(jobAnalysis);
            
            // Phase 3: Resume-Job Matching Validation (Target: <1 second)
            console.log('🎯 Phase 3: Validating resume-job match...');
            const matchResult = await this.validateResumeMatch(resumeResult.resumeContent, jobAnalysis);
            
            // Phase 4: Resume Optimization (if needed, Target: <2 seconds)
            let finalResume = resumeResult;
            if (!matchResult.meetsThreshold) {
                console.log('🔧 Phase 4: Optimizing resume for better match...');
                finalResume = await this.optimizeResume(resumeResult, jobAnalysis, matchResult);
            }

            // Phase 5: Resume File Generation (Target: <1 second)
            console.log('💾 Phase 5: Creating resume file...');
            const resumeFilePath = await this.createResumeFile(finalResume, jobAnalysis);
            
            // Phase 6: Autonomous LinkedIn Application (Target: <5 seconds)
            console.log('🌐 Phase 6: Submitting LinkedIn application...');
            const applicationResult = await this.submitLinkedInApplication(jobData, resumeFilePath);
            
            // Phase 7: Comprehensive Tracking (Target: <1 second)
            console.log('📋 Phase 7: Recording application tracking...');
            const trackingResult = await this.trackApplication({
                jobData,
                jobAnalysis,
                resumeResult: finalResume,
                matchResult,
                applicationResult,
                resumeFilePath,
                processingTime: (Date.now() - startTime) / 1000
            });

            const totalTime = (Date.now() - startTime) / 1000;
            console.log(`✅ Application completed in ${totalTime}s (Target: <${this.performanceTargets.maxProcessingTime}s)`);

            return {
                success: true,
                applicationId: trackingResult.applicationId,
                jobTitle: jobData.title,
                company: jobData.company,
                matchScore: matchResult.totalScore,
                processingTime: totalTime,
                resumeVersion: finalResume.metadata.version,
                applicationStatus: applicationResult.status,
                linearIssue: trackingResult.linearIssue,
                performanceMetrics: {
                    meetsTimeTarget: totalTime <= this.performanceTargets.maxProcessingTime,
                    meetsMatchTarget: matchResult.totalScore >= this.performanceTargets.minMatchScore,
                    qualityLevel: matchResult.qualityLevel
                }
            };

        } catch (error) {
            console.error('❌ Autonomous application failed:', error);
            
            // Track failed application
            await this.trackFailedApplication(jobData, error, (Date.now() - startTime) / 1000);
            
            return {
                success: false,
                error: error.message,
                jobTitle: jobData.title,
                company: jobData.company,
                processingTime: (Date.now() - startTime) / 1000
            };
        }
    }

    /**
     * Analyze job description and extract requirements
     */
    async analyzeJobDescription(jobData) {
        const analysis = this.jobAnalyzer.analyzeJobDescription(
            jobData.description,
            jobData.title,
            jobData.company
        );
        
        console.log(`   ✓ Extracted ${Object.values(analysis.extractedSkills).flat().length} skills`);
        console.log(`   ✓ Industry: ${analysis.industryContext.primary} (${Math.round(analysis.industryContext.confidence * 100)}% confidence)`);
        console.log(`   ✓ Experience Level: ${analysis.experienceLevel}`);
        
        return analysis;
    }

    /**
     * Generate customized resume based on job analysis
     */
    async generateCustomizedResume(jobAnalysis) {
        const resumeResult = this.resumeGenerator.generateCustomizedResume(jobAnalysis);
        
        console.log(`   ✓ Generated ${resumeResult.metadata.templateType} resume in ${resumeResult.metadata.generationTime}s`);
        console.log(`   ✓ Version: ${resumeResult.metadata.version}`);
        console.log(`   ✓ Customizations: ${resumeResult.metadata.customizations.length}`);
        
        return resumeResult;
    }

    /**
     * Validate resume-job matching score
     */
    async validateResumeMatch(resumeContent, jobAnalysis) {
        const matchResult = this.jobMatcher.calculateMatchScore(resumeContent, jobAnalysis);
        
        console.log(`   ✓ Match Score: ${matchResult.totalScore}% (${matchResult.qualityLevel})`);
        console.log(`   ✓ Meets Threshold: ${matchResult.meetsThreshold ? 'Yes' : 'No'}`);
        
        if (matchResult.recommendations.length > 0) {
            console.log(`   ⚠️ Recommendations: ${matchResult.recommendations.length}`);
        }
        
        return matchResult;
    }

    /**
     * Optimize resume if match score is below threshold
     */
    async optimizeResume(resumeResult, jobAnalysis, matchResult) {
        console.log(`   🔧 Optimizing resume (current score: ${matchResult.totalScore}%)`);
        
        // Enhanced resume generation with focus on weak areas
        const optimizationFocus = this.identifyOptimizationAreas(matchResult);
        
        // Re-generate with optimization focus
        const optimizedResume = this.resumeGenerator.generateCustomizedResume(jobAnalysis, optimizationFocus);
        
        // Validate improved match
        const newMatchResult = this.jobMatcher.calculateMatchScore(optimizedResume.resumeContent, jobAnalysis);
        
        console.log(`   ✓ Optimized Score: ${newMatchResult.totalScore}% (improvement: +${newMatchResult.totalScore - matchResult.totalScore}%)`);
        
        return optimizedResume;
    }

    /**
     * Create physical resume file for upload
     */
    async createResumeFile(resumeResult, jobAnalysis) {
        const fileName = `${resumeResult.metadata.version}.docx`;
        const filePath = path.join(this.resumeOutputPath, fileName);
        
        // Generate resume document (simplified - would use actual document generation)
        const resumeContent = this.formatResumeForFile(resumeResult.resumeContent);
        
        // Save resume file
        fs.writeFileSync(filePath, resumeContent);
        
        console.log(`   ✓ Resume file created: ${fileName}`);
        
        return filePath;
    }

    /**
     * Submit LinkedIn application using proven autonomous workflow
     */
    async submitLinkedInApplication(jobData, resumeFilePath) {
        console.log(`   🌐 Navigating to job: ${jobData.url}`);
        
        // Use proven browsermcp autonomous workflow
        await this.browsermcpClient.navigate(jobData.url);
        await this.browsermcpClient.clickEasyApply();
        
        // Upload customized resume
        await this.browsermcpClient.uploadResume(resumeFilePath);
        
        // Complete application form with intelligent responses
        await this.browsermcpClient.completeApplicationForm(jobData);
        
        // Submit application
        const submissionResult = await this.browsermcpClient.submitApplication();
        
        console.log(`   ✅ Application submitted: ${submissionResult.confirmation}`);
        
        return submissionResult;
    }

    /**
     * Track application with comprehensive data
     */
    async trackApplication(applicationData) {
        const trackingData = {
            jobTitle: applicationData.jobData.title,
            company: applicationData.jobData.company,
            jobUrl: applicationData.jobData.url,
            jobDescription: applicationData.jobData.description,
            salary: applicationData.jobData.salary,
            location: applicationData.jobData.location,
            jobAnalysis: applicationData.jobAnalysis,
            resumeMetadata: applicationData.resumeResult.metadata,
            resumeFilePath: applicationData.resumeFilePath,
            resumeFileSize: this.getFileSize(applicationData.resumeFilePath),
            matchScore: applicationData.matchResult,
            processingTime: applicationData.processingTime,
            status: applicationData.applicationResult.status,
            confirmation: applicationData.applicationResult.confirmation,
            screenshotPath: applicationData.applicationResult.screenshotPath,
            automationLevel: 'autonomous',
            errors: [],
            userInterventions: 0
        };

        const trackingResult = await this.applicationTracker.trackApplication(trackingData);
        
        console.log(`   📋 Tracking created: ${trackingResult.applicationId}`);
        if (trackingResult.linearIssue) {
            console.log(`   🔗 Linear issue: ${trackingResult.linearIssue.identifier}`);
        }
        
        return trackingResult;
    }

    /**
     * Track failed application for analysis
     */
    async trackFailedApplication(jobData, error, processingTime) {
        const failureData = {
            jobTitle: jobData.title,
            company: jobData.company,
            jobUrl: jobData.url,
            processingTime,
            status: 'failed',
            errors: [error.message],
            automationLevel: 'autonomous',
            userInterventions: 0
        };

        await this.applicationTracker.trackApplication(failureData);
    }

    // Helper methods
    identifyOptimizationAreas(matchResult) {
        const weakAreas = [];
        
        Object.entries(matchResult.breakdown).forEach(([area, score]) => {
            if (score < 0.7) {
                weakAreas.push(area);
            }
        });
        
        return weakAreas;
    }

    formatResumeForFile(resumeContent) {
        // Simplified - would generate actual DOCX file
        return JSON.stringify(resumeContent, null, 2);
    }

    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    ensureResumeDirectory() {
        if (!fs.existsSync(this.resumeOutputPath)) {
            fs.mkdirSync(this.resumeOutputPath, { recursive: true });
        }
    }

    /**
     * Generate performance report
     */
    async generatePerformanceReport(timeframe = 'week') {
        return await this.applicationTracker.generatePerformanceReport(timeframe);
    }

    /**
     * Batch processing capability
     */
    async processBatchApplications(jobList, maxApplications = 5) {
        const results = [];
        
        for (let i = 0; i < Math.min(jobList.length, maxApplications); i++) {
            const job = jobList[i];
            console.log(`\n🎯 Processing application ${i + 1}/${Math.min(jobList.length, maxApplications)}`);
            
            const result = await this.executeAutonomousApplication(job);
            results.push(result);
            
            // Human-like delay between applications (2-5 minutes)
            if (i < Math.min(jobList.length, maxApplications) - 1) {
                const delay = Math.random() * 180000 + 120000; // 2-5 minutes
                console.log(`⏱️ Waiting ${Math.round(delay / 1000)}s before next application...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return {
            totalProcessed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            averageMatchScore: results.reduce((sum, r) => sum + (r.matchScore || 0), 0) / results.length,
            averageProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
            results
        };
    }
}

module.exports = AutonomousApplicationEngine;
