/**
 * Comprehensive Application Tracker
 * Tracks all job applications with detailed resume-job pairing data
 * Integrates with Linear for project management and reporting
 */

const fs = require('fs');
const path = require('path');

class ApplicationTracker {
    constructor(linearClient) {
        this.linearClient = linearClient;
        this.trackingDataPath = path.join(__dirname, '../../data/application-tracking.json');
        this.applicationsData = this.loadTrackingData();
        
        // Ensure data directory exists
        this.ensureDataDirectory();
    }

    /**
     * Track a new job application with comprehensive details
     * @param {Object} applicationData - Complete application information
     * @returns {Object} Tracking result with application ID
     */
    async trackApplication(applicationData) {
        const applicationId = this.generateApplicationId();
        const timestamp = new Date().toISOString();
        
        const trackingEntry = {
            applicationId,
            timestamp,
            jobDetails: {
                title: applicationData.jobTitle,
                company: applicationData.company,
                url: applicationData.jobUrl,
                description: applicationData.jobDescription,
                salary: applicationData.salary,
                location: applicationData.location,
                requirements: applicationData.jobAnalysis?.keyRequirements || [],
                extractedSkills: applicationData.jobAnalysis?.extractedSkills || {},
                industryContext: applicationData.jobAnalysis?.industryContext || {}
            },
            resumeDetails: {
                version: applicationData.resumeMetadata?.version,
                templateType: applicationData.resumeMetadata?.templateType,
                customizations: applicationData.resumeMetadata?.customizations || [],
                generationTime: applicationData.resumeMetadata?.generationTime,
                filePath: applicationData.resumeFilePath,
                fileSize: applicationData.resumeFileSize
            },
            matchingResults: {
                totalScore: applicationData.matchScore?.totalScore,
                breakdown: applicationData.matchScore?.breakdown || {},
                qualityLevel: applicationData.matchScore?.qualityLevel,
                meetsThreshold: applicationData.matchScore?.meetsThreshold,
                recommendations: applicationData.matchScore?.recommendations || []
            },
            applicationProcess: {
                processingTime: applicationData.processingTime,
                automationLevel: applicationData.automationLevel || 'autonomous',
                errorsEncountered: applicationData.errors || [],
                userInterventions: applicationData.userInterventions || 0
            },
            applicationOutcome: {
                status: applicationData.status || 'submitted',
                confirmation: applicationData.confirmation,
                linkedinApplicationId: applicationData.linkedinApplicationId,
                screenshotPath: applicationData.screenshotPath,
                followUpRequired: applicationData.followUpRequired || false
            },
            linearIntegration: {
                issueId: null, // Will be populated after Linear issue creation
                issueUrl: null,
                projectId: applicationData.projectId || 'ac0c6c00-64a9-4db9-bad2-1593944c3c3a'
            },
            metadata: {
                browserSession: applicationData.browserSession,
                userAgent: applicationData.userAgent,
                ipAddress: applicationData.ipAddress,
                applicationSource: 'autonomous-linkedin-automation'
            }
        };

        // Save to tracking data
        this.applicationsData.applications.push(trackingEntry);
        this.saveTrackingData();

        // Create Linear issue for tracking
        const linearIssue = await this.createLinearTrackingIssue(trackingEntry);
        if (linearIssue) {
            trackingEntry.linearIntegration.issueId = linearIssue.identifier;
            trackingEntry.linearIntegration.issueUrl = linearIssue.url;
            this.saveTrackingData();
        }

        // Update statistics
        this.updateTrackingStatistics();

        return {
            success: true,
            applicationId,
            trackingEntry,
            linearIssue
        };
    }

    /**
     * Create Linear issue for application tracking
     */
    async createLinearTrackingIssue(trackingEntry) {
        try {
            const issueTitle = `📋 APPLICATION: ${trackingEntry.jobDetails.title} at ${trackingEntry.jobDetails.company}`;
            
            const issueDescription = this.generateLinearIssueDescription(trackingEntry);
            
            const linearResult = await this.linearClient.createIssue({
                title: issueTitle,
                description: issueDescription,
                projectId: trackingEntry.linearIntegration.projectId,
                assigneeId: 'a74dd4f8-6bc7-4172-9883-c954b43caaff', // Ivo Dachev
                stateId: 'a01f1e31-8258-497f-bbba-23eb5d34c005', // Done state
                labels: ['job-application', 'autonomous-submission', `match-score-${Math.floor(trackingEntry.matchingResults.totalScore / 10) * 10}`]
            });

            return linearResult.issue;
        } catch (error) {
            console.error('Failed to create Linear tracking issue:', error);
            return null;
        }
    }

    /**
     * Generate comprehensive Linear issue description
     */
    generateLinearIssueDescription(trackingEntry) {
        const job = trackingEntry.jobDetails;
        const resume = trackingEntry.resumeDetails;
        const match = trackingEntry.matchingResults;
        const outcome = trackingEntry.applicationOutcome;

        return `
## 🎯 Job Application Summary

**Position**: ${job.title}  
**Company**: ${job.company}  
**Location**: ${job.location}  
**Salary**: ${job.salary || 'Not specified'}  
**Application Date**: ${new Date(trackingEntry.timestamp).toLocaleDateString()}  

## 📄 Resume Details

**Version**: ${resume.version}  
**Template**: ${resume.templateType}  
**Generation Time**: ${resume.generationTime}s  
**Customizations**: ${resume.customizations.join(', ')}  

## 📊 Match Analysis

**Overall Score**: ${match.totalScore}% (${match.qualityLevel})  
**Meets Threshold**: ${match.meetsThreshold ? '✅ Yes' : '❌ No'}  

**Breakdown**:
- Skills Match: ${Math.round(match.breakdown.skillsMatch * 100)}%
- Experience Relevance: ${Math.round(match.breakdown.experienceRelevance * 100)}%
- Industry Alignment: ${Math.round(match.breakdown.industryAlignment * 100)}%
- Keyword Density: ${Math.round(match.breakdown.keywordDensity * 100)}%
- Achievements Relevance: ${Math.round(match.breakdown.achievementsRelevance * 100)}%

## 🚀 Application Process

**Status**: ${outcome.status}  
**Processing Time**: ${trackingEntry.applicationProcess.processingTime}s  
**Automation Level**: ${trackingEntry.applicationProcess.automationLevel}  
**User Interventions**: ${trackingEntry.applicationProcess.userInterventions}  
**Confirmation**: ${outcome.confirmation}  

## 🔗 Links

**Job URL**: ${job.url}  
**Screenshot**: ${outcome.screenshotPath || 'Not captured'}  

## 📈 Key Skills Matched

${Object.entries(job.extractedSkills).map(([category, skills]) => 
    skills.length > 0 ? `**${category.toUpperCase()}**: ${skills.join(', ')}` : ''
).filter(Boolean).join('\n')}

## 💡 Recommendations

${match.recommendations.map(rec => `- ${rec}`).join('\n')}
        `.trim();
    }

    /**
     * Update application status
     */
    async updateApplicationStatus(applicationId, statusUpdate) {
        const application = this.applicationsData.applications.find(app => 
            app.applicationId === applicationId
        );

        if (!application) {
            throw new Error(`Application ${applicationId} not found`);
        }

        // Update status
        Object.assign(application.applicationOutcome, statusUpdate);
        application.lastUpdated = new Date().toISOString();

        this.saveTrackingData();

        // Update Linear issue if exists
        if (application.linearIntegration.issueId) {
            await this.updateLinearIssue(application);
        }

        return application;
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport(timeframe = 'all') {
        const applications = this.getApplicationsInTimeframe(timeframe);
        
        if (applications.length === 0) {
            return { error: 'No applications found for specified timeframe' };
        }

        const report = {
            summary: {
                totalApplications: applications.length,
                timeframe,
                reportGenerated: new Date().toISOString()
            },
            matchScoreAnalysis: this.analyzeMatchScores(applications),
            templatePerformance: this.analyzeTemplatePerformance(applications),
            industryBreakdown: this.analyzeIndustryBreakdown(applications),
            processingMetrics: this.analyzeProcessingMetrics(applications),
            qualityTrends: this.analyzeQualityTrends(applications),
            recommendations: this.generateReportRecommendations(applications)
        };

        return report;
    }

    /**
     * Analyze match scores across applications
     */
    analyzeMatchScores(applications) {
        const scores = applications.map(app => app.matchingResults.totalScore).filter(Boolean);
        
        return {
            average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
            median: this.calculateMedian(scores),
            minimum: Math.min(...scores),
            maximum: Math.max(...scores),
            aboveThreshold: scores.filter(score => score >= 80).length,
            belowThreshold: scores.filter(score => score < 80).length,
            distribution: {
                excellent: scores.filter(score => score >= 95).length,
                good: scores.filter(score => score >= 90 && score < 95).length,
                acceptable: scores.filter(score => score >= 80 && score < 90).length,
                needsImprovement: scores.filter(score => score < 80).length
            }
        };
    }

    /**
     * Analyze template performance
     */
    analyzeTemplatePerformance(applications) {
        const templateStats = {};
        
        applications.forEach(app => {
            const template = app.resumeDetails.templateType;
            if (!templateStats[template]) {
                templateStats[template] = {
                    count: 0,
                    totalScore: 0,
                    averageScore: 0,
                    successRate: 0
                };
            }
            
            templateStats[template].count++;
            templateStats[template].totalScore += app.matchingResults.totalScore || 0;
        });

        // Calculate averages
        Object.keys(templateStats).forEach(template => {
            const stats = templateStats[template];
            stats.averageScore = stats.totalScore / stats.count;
            stats.successRate = stats.averageScore >= 80 ? 1 : 0;
        });

        return templateStats;
    }

    // Helper methods
    generateApplicationId() {
        return `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    loadTrackingData() {
        try {
            if (fs.existsSync(this.trackingDataPath)) {
                const data = fs.readFileSync(this.trackingDataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading tracking data:', error);
        }
        
        return {
            applications: [],
            statistics: {
                totalApplications: 0,
                averageMatchScore: 0,
                successRate: 0,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    saveTrackingData() {
        try {
            fs.writeFileSync(this.trackingDataPath, JSON.stringify(this.applicationsData, null, 2));
        } catch (error) {
            console.error('Error saving tracking data:', error);
        }
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.trackingDataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    updateTrackingStatistics() {
        const apps = this.applicationsData.applications;
        const scores = apps.map(app => app.matchingResults.totalScore).filter(Boolean);
        
        this.applicationsData.statistics = {
            totalApplications: apps.length,
            averageMatchScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
            successRate: scores.filter(score => score >= 80).length / scores.length,
            lastUpdated: new Date().toISOString()
        };
    }

    getApplicationsInTimeframe(timeframe) {
        const now = new Date();
        let cutoffDate;
        
        switch (timeframe) {
            case 'today':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                return this.applicationsData.applications;
        }
        
        return this.applicationsData.applications.filter(app => 
            new Date(app.timestamp) >= cutoffDate
        );
    }

    calculateMedian(numbers) {
        const sorted = numbers.sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    }

    analyzeIndustryBreakdown(applications) {
        const industries = {};
        applications.forEach(app => {
            const industry = app.jobDetails.industryContext?.primary || 'unknown';
            industries[industry] = (industries[industry] || 0) + 1;
        });
        return industries;
    }

    analyzeProcessingMetrics(applications) {
        const times = applications.map(app => app.applicationProcess.processingTime).filter(Boolean);
        return {
            averageProcessingTime: times.reduce((sum, time) => sum + time, 0) / times.length,
            fastestApplication: Math.min(...times),
            slowestApplication: Math.max(...times)
        };
    }

    analyzeQualityTrends(applications) {
        // Simplified trend analysis
        const recent = applications.slice(-10);
        const older = applications.slice(0, -10);
        
        const recentAvg = recent.reduce((sum, app) => sum + (app.matchingResults.totalScore || 0), 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, app) => sum + (app.matchingResults.totalScore || 0), 0) / older.length : recentAvg;
        
        return {
            trend: recentAvg > olderAvg ? 'improving' : 'declining',
            recentAverage: recentAvg,
            previousAverage: olderAvg,
            improvement: recentAvg - olderAvg
        };
    }

    generateReportRecommendations(applications) {
        const recommendations = [];
        const avgScore = applications.reduce((sum, app) => sum + (app.matchingResults.totalScore || 0), 0) / applications.length;
        
        if (avgScore < 85) {
            recommendations.push('Focus on improving resume-job matching algorithms');
        }
        
        if (applications.filter(app => app.matchingResults.totalScore < 80).length > applications.length * 0.2) {
            recommendations.push('Review and enhance job filtering criteria');
        }
        
        return recommendations;
    }
}

module.exports = ApplicationTracker;
