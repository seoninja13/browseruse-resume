/**
 * Resume Customization System Test
 * Validates 80-90% job matching and autonomous integration
 */

const JobDescriptionAnalyzer = require('../src/resume-customization/job-description-analyzer');
const DynamicResumeGenerator = require('../src/resume-customization/dynamic-resume-generator');
const ResumeJobMatcher = require('../src/resume-customization/resume-job-matcher');
const AutonomousApplicationEngine = require('../src/resume-customization/autonomous-application-engine');

class ResumeCustomizationTest {
    constructor() {
        this.jobAnalyzer = new JobDescriptionAnalyzer();
        this.resumeGenerator = new DynamicResumeGenerator();
        this.jobMatcher = new ResumeJobMatcher();
        
        // Test job data (based on our successful SEO Lead application)
        this.testJobs = [
            {
                title: "SEO Lead",
                company: "LaSalle Network",
                description: `We are seeking an experienced SEO Lead to drive organic growth and search engine optimization strategies. The ideal candidate will have 5+ years of SEO experience, expertise in Google Analytics, Search Console, keyword research, content optimization, and technical SEO. 

                Key Responsibilities:
                • Develop and execute comprehensive SEO strategies
                • Conduct keyword research and competitive analysis
                • Optimize website content and technical elements
                • Monitor and report on organic traffic performance
                • Lead SEO initiatives across multiple projects
                • Collaborate with content and development teams
                
                Required Qualifications:
                • 5+ years of SEO experience
                • Proficiency in Google Analytics and Search Console
                • Experience with keyword research tools
                • Strong understanding of technical SEO
                • Content optimization expertise
                • Team leadership experience
                
                Preferred Qualifications:
                • PPC campaign management experience
                • Marketing automation knowledge
                • A/B testing experience
                • Agency or in-house marketing experience`,
                url: "https://linkedin.com/jobs/view/4240074101",
                salary: "$45-55/hr",
                location: "Remote"
            },
            {
                title: "Senior Full Stack Developer",
                company: "Tech Startup Inc",
                description: `Join our innovative team as a Senior Full Stack Developer. We're looking for an experienced engineer with 7+ years of experience in JavaScript, React, Node.js, and cloud technologies.

                Key Responsibilities:
                • Design and develop scalable web applications
                • Lead technical architecture decisions
                • Mentor junior developers
                • Implement CI/CD pipelines
                • Work with AWS cloud services
                
                Required Skills:
                • JavaScript, React, Node.js
                • AWS, Docker, Kubernetes
                • SQL and NoSQL databases
                • RESTful API development
                • Agile development experience`,
                url: "https://linkedin.com/jobs/view/1234567890",
                salary: "$120-150k",
                location: "San Francisco, CA"
            }
        ];
    }

    /**
     * Run comprehensive test suite
     */
    async runAllTests() {
        console.log('🧪 Starting Resume Customization System Tests\n');
        
        const results = {
            jobAnalysisTests: await this.testJobAnalysis(),
            resumeGenerationTests: await this.testResumeGeneration(),
            matchingValidationTests: await this.testMatchingValidation(),
            integrationTests: await this.testSystemIntegration(),
            performanceTests: await this.testPerformanceTargets()
        };

        this.generateTestReport(results);
        return results;
    }

    /**
     * Test job description analysis
     */
    async testJobAnalysis() {
        console.log('📊 Testing Job Description Analysis...');
        const results = [];

        for (const job of this.testJobs) {
            const startTime = Date.now();
            const analysis = this.jobAnalyzer.analyzeJobDescription(job.description, job.title, job.company);
            const analysisTime = (Date.now() - startTime) / 1000;

            const result = {
                jobTitle: job.title,
                analysisTime,
                skillsExtracted: Object.values(analysis.extractedSkills).flat().length,
                industryDetected: analysis.industryContext.primary,
                industryConfidence: analysis.industryContext.confidence,
                experienceLevel: analysis.experienceLevel,
                keyRequirements: analysis.keyRequirements.length,
                keywords: analysis.keywords.length,
                passed: this.validateJobAnalysis(analysis, job)
            };

            results.push(result);
            console.log(`   ✓ ${job.title}: ${result.skillsExtracted} skills, ${result.industryDetected} industry (${Math.round(result.industryConfidence * 100)}%)`);
        }

        return results;
    }

    /**
     * Test resume generation
     */
    async testResumeGeneration() {
        console.log('\n📄 Testing Resume Generation...');
        const results = [];

        for (const job of this.testJobs) {
            const analysis = this.jobAnalyzer.analyzeJobDescription(job.description, job.title, job.company);
            
            const startTime = Date.now();
            const resumeResult = this.resumeGenerator.generateCustomizedResume(analysis);
            const generationTime = (Date.now() - startTime) / 1000;

            const result = {
                jobTitle: job.title,
                generationTime,
                templateType: resumeResult.metadata.templateType,
                customizations: resumeResult.metadata.customizations.length,
                resumeVersion: resumeResult.metadata.version,
                primarySkills: resumeResult.resumeContent.skills?.primary?.length || 0,
                achievements: resumeResult.resumeContent.achievements?.length || 0,
                passed: this.validateResumeGeneration(resumeResult, analysis)
            };

            results.push(result);
            console.log(`   ✓ ${job.title}: ${result.templateType} template, ${result.customizations} customizations, ${result.generationTime}s`);
        }

        return results;
    }

    /**
     * Test matching validation
     */
    async testMatchingValidation() {
        console.log('\n🎯 Testing Resume-Job Matching...');
        const results = [];

        for (const job of this.testJobs) {
            const analysis = this.jobAnalyzer.analyzeJobDescription(job.description, job.title, job.company);
            const resumeResult = this.resumeGenerator.generateCustomizedResume(analysis);
            
            const startTime = Date.now();
            const matchResult = this.jobMatcher.calculateMatchScore(resumeResult.resumeContent, analysis);
            const matchingTime = (Date.now() - startTime) / 1000;

            const result = {
                jobTitle: job.title,
                matchingTime,
                totalScore: matchResult.totalScore,
                qualityLevel: matchResult.qualityLevel,
                meetsThreshold: matchResult.meetsThreshold,
                skillsMatch: Math.round(matchResult.breakdown.skillsMatch * 100),
                experienceRelevance: Math.round(matchResult.breakdown.experienceRelevance * 100),
                industryAlignment: Math.round(matchResult.breakdown.industryAlignment * 100),
                keywordDensity: Math.round(matchResult.breakdown.keywordDensity * 100),
                achievementsRelevance: Math.round(matchResult.breakdown.achievementsRelevance * 100),
                recommendations: matchResult.recommendations.length,
                passed: matchResult.totalScore >= 80
            };

            results.push(result);
            console.log(`   ✓ ${job.title}: ${result.totalScore}% match (${result.qualityLevel}) - ${result.meetsThreshold ? 'PASS' : 'FAIL'}`);
            console.log(`     Skills: ${result.skillsMatch}%, Experience: ${result.experienceRelevance}%, Industry: ${result.industryAlignment}%`);
        }

        return results;
    }

    /**
     * Test system integration
     */
    async testSystemIntegration() {
        console.log('\n🔧 Testing System Integration...');
        const results = [];

        // Test end-to-end workflow (without actual LinkedIn submission)
        for (const job of this.testJobs) {
            const startTime = Date.now();
            
            try {
                // Simulate full workflow
                const analysis = this.jobAnalyzer.analyzeJobDescription(job.description, job.title, job.company);
                const resumeResult = this.resumeGenerator.generateCustomizedResume(analysis);
                const matchResult = this.jobMatcher.calculateMatchScore(resumeResult.resumeContent, analysis);
                
                const totalTime = (Date.now() - startTime) / 1000;

                const result = {
                    jobTitle: job.title,
                    totalProcessingTime: totalTime,
                    matchScore: matchResult.totalScore,
                    meetsTimeTarget: totalTime <= 15, // 15-second target
                    meetsMatchTarget: matchResult.totalScore >= 80,
                    workflowComplete: true,
                    passed: totalTime <= 15 && matchResult.totalScore >= 80
                };

                results.push(result);
                console.log(`   ✓ ${job.title}: ${totalTime}s processing, ${matchResult.totalScore}% match - ${result.passed ? 'PASS' : 'FAIL'}`);

            } catch (error) {
                const result = {
                    jobTitle: job.title,
                    error: error.message,
                    workflowComplete: false,
                    passed: false
                };
                results.push(result);
                console.log(`   ❌ ${job.title}: ERROR - ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Test performance targets
     */
    async testPerformanceTargets() {
        console.log('\n⚡ Testing Performance Targets...');
        
        const performanceTests = [];
        const iterations = 5; // Test multiple iterations for consistency

        for (let i = 0; i < iterations; i++) {
            const job = this.testJobs[0]; // Use SEO Lead job for performance testing
            
            const startTime = Date.now();
            const analysis = this.jobAnalyzer.analyzeJobDescription(job.description, job.title, job.company);
            const analysisTime = Date.now() - startTime;

            const resumeStartTime = Date.now();
            const resumeResult = this.resumeGenerator.generateCustomizedResume(analysis);
            const resumeTime = Date.now() - resumeStartTime;

            const matchStartTime = Date.now();
            const matchResult = this.jobMatcher.calculateMatchScore(resumeResult.resumeContent, analysis);
            const matchTime = Date.now() - matchStartTime;

            const totalTime = (analysisTime + resumeTime + matchTime) / 1000;

            performanceTests.push({
                iteration: i + 1,
                analysisTime: analysisTime / 1000,
                resumeTime: resumeTime / 1000,
                matchTime: matchTime / 1000,
                totalTime,
                matchScore: matchResult.totalScore
            });
        }

        const avgTotalTime = performanceTests.reduce((sum, test) => sum + test.totalTime, 0) / iterations;
        const avgMatchScore = performanceTests.reduce((sum, test) => sum + test.matchScore, 0) / iterations;

        const result = {
            iterations,
            averageProcessingTime: avgTotalTime,
            averageMatchScore: avgMatchScore,
            meetsTimeTarget: avgTotalTime <= 15,
            meetsMatchTarget: avgMatchScore >= 80,
            consistency: this.calculateConsistency(performanceTests),
            passed: avgTotalTime <= 15 && avgMatchScore >= 80
        };

        console.log(`   ✓ Average Processing Time: ${avgTotalTime.toFixed(2)}s (Target: ≤15s)`);
        console.log(`   ✓ Average Match Score: ${avgMatchScore.toFixed(1)}% (Target: ≥80%)`);
        console.log(`   ✓ Performance Target: ${result.passed ? 'PASS' : 'FAIL'}`);

        return result;
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport(results) {
        console.log('\n📋 TEST REPORT SUMMARY');
        console.log('=' .repeat(50));

        const allTests = [
            ...results.jobAnalysisTests,
            ...results.resumeGenerationTests,
            ...results.matchingValidationTests,
            ...results.integrationTests
        ];

        const passedTests = allTests.filter(test => test.passed).length;
        const totalTests = allTests.length;
        const successRate = (passedTests / totalTests) * 100;

        console.log(`Overall Success Rate: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
        console.log(`Performance Targets: ${results.performanceTests.passed ? 'PASS' : 'FAIL'}`);
        
        // Match score analysis
        const matchScores = results.matchingValidationTests.map(test => test.totalScore);
        const avgMatchScore = matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length;
        const minMatchScore = Math.min(...matchScores);
        const maxMatchScore = Math.max(...matchScores);

        console.log(`\nMatch Score Analysis:`);
        console.log(`  Average: ${avgMatchScore.toFixed(1)}%`);
        console.log(`  Range: ${minMatchScore}% - ${maxMatchScore}%`);
        console.log(`  Above 80%: ${matchScores.filter(score => score >= 80).length}/${matchScores.length}`);
        console.log(`  Above 90%: ${matchScores.filter(score => score >= 90).length}/${matchScores.length}`);

        // Performance analysis
        console.log(`\nPerformance Analysis:`);
        console.log(`  Average Processing Time: ${results.performanceTests.averageProcessingTime.toFixed(2)}s`);
        console.log(`  Time Target (≤15s): ${results.performanceTests.meetsTimeTarget ? 'PASS' : 'FAIL'}`);
        console.log(`  Match Target (≥80%): ${results.performanceTests.meetsMatchTarget ? 'PASS' : 'FAIL'}`);

        console.log('\n🎯 SYSTEM VALIDATION COMPLETE');
        
        if (successRate >= 90 && results.performanceTests.passed) {
            console.log('✅ Resume Customization System READY FOR PRODUCTION');
        } else {
            console.log('⚠️ Resume Customization System NEEDS OPTIMIZATION');
        }
    }

    // Validation helper methods
    validateJobAnalysis(analysis, job) {
        return analysis.extractedSkills && 
               analysis.industryContext && 
               analysis.experienceLevel && 
               analysis.keyRequirements.length > 0;
    }

    validateResumeGeneration(resumeResult, analysis) {
        return resumeResult.resumeContent && 
               resumeResult.metadata && 
               resumeResult.metadata.templateType && 
               resumeResult.metadata.customizations.length > 0;
    }

    calculateConsistency(tests) {
        const times = tests.map(test => test.totalTime);
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            standardDeviation: stdDev,
            coefficientOfVariation: (stdDev / avg) * 100,
            consistent: (stdDev / avg) < 0.2 // Less than 20% variation
        };
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new ResumeCustomizationTest();
    test.runAllTests().then(results => {
        process.exit(0);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = ResumeCustomizationTest;
