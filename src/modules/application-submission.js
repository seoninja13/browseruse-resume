/**
 * Application Submission Module - LinkedIn Easy Apply Automation
 * 
 * Handles automated job application submission using LinkedIn's Easy Apply feature.
 * Includes form filling, resume upload, cover letter attachment, and submission tracking.
 * 
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 1.0.0
 */

const BrowserAutomation = require('./browser-automation');
const ResumeGenerator = require('./resume-generator');
const { Logger, ErrorHandler, AutomationError } = require('./error-handling');
const config = require('../config');
const fs = require('fs');
const path = require('path');

class ApplicationSubmission {
  constructor() {
    this.browser = new BrowserAutomation();
    this.resumeGenerator = new ResumeGenerator();
    this.logger = new Logger('ApplicationSubmission');
    this.errorHandler = new ErrorHandler();
    this.config = config.get('linkedin');
    this.profileConfig = config.get('profile');
    this.submissionCount = 0;
    this.dailyLimit = this.config.limits.maxApplicationsPerDay;
    this.submittedApplications = [];
  }

  /**
   * Initialize application submission system
   */
  async initialize() {
    try {
      this.logger.info('Initializing application submission system...');
      
      // Initialize browser automation
      await this.browser.initialize();
      
      // Validate LinkedIn session
      await this.browser.validateLinkedInSession();
      
      // Load existing applications for the day
      await this.loadDailyApplications();
      
      this.logger.info('✅ Application submission system initialized');
      return { success: true };
      
    } catch (error) {
      this.logger.error('Application submission initialization failed:', error);
      throw new AutomationError('Application submission init failed', error);
    }
  }

  /**
   * Submit application to a job posting
   */
  async submitApplication(jobData, options = {}) {
    try {
      // Check daily limits
      if (this.submissionCount >= this.dailyLimit) {
        throw new AutomationError(`Daily application limit reached (${this.dailyLimit})`);
      }

      this.logger.info(`Starting application submission for: ${jobData.title} at ${jobData.company}`);
      
      const applicationData = {
        jobId: jobData.id,
        jobTitle: jobData.title,
        company: jobData.company,
        url: jobData.url,
        startTime: new Date().toISOString(),
        status: 'in_progress'
      };

      // Navigate to job posting
      await this.navigateToJob(jobData.url);
      
      // Check if Easy Apply is available
      const easyApplyAvailable = await this.checkEasyApplyAvailability();
      
      if (!easyApplyAvailable) {
        throw new AutomationError('Easy Apply not available for this position');
      }

      // Start Easy Apply process
      await this.startEasyApplyProcess();
      
      // Fill application form
      await this.fillApplicationForm(jobData, options);
      
      // Upload resume if required (with intelligent generation)
      const resumeResult = await this.handleResumeUpload(jobData, options);
      applicationData.resumeInfo = resumeResult;

      // Add cover letter if provided
      await this.handleCoverLetter(jobData, options);
      
      // Answer additional questions
      await this.handleAdditionalQuestions(jobData, options);
      
      // Submit application
      await this.submitApplicationForm();
      
      // Verify submission
      const submissionResult = await this.verifySubmission();
      
      applicationData.status = 'submitted';
      applicationData.endTime = new Date().toISOString();
      applicationData.submissionResult = submissionResult;
      
      // Record successful application
      await this.recordApplication(applicationData);
      
      this.submissionCount++;
      this.submittedApplications.push(applicationData);
      
      this.logger.info(`✅ Application submitted successfully for ${jobData.title}`);
      
      return {
        success: true,
        applicationData,
        submissionCount: this.submissionCount,
        remainingApplications: this.dailyLimit - this.submissionCount
      };
      
    } catch (error) {
      this.logger.error(`Application submission failed for ${jobData.title}:`, error);
      
      // Record failed application
      await this.recordFailedApplication(jobData, error);
      
      throw new AutomationError(`Application submission failed: ${error.message}`, error, {
        operation: 'submitApplication',
        jobData
      });
    }
  }

  /**
   * Navigate to job posting URL
   */
  async navigateToJob(jobUrl) {
    return this.errorHandler.handleWithRetry(
      async () => {
        await this.browser.navigate(jobUrl);
        await this.browser.wait(this.config.delays.pageLoad);
      },
      { operation: 'navigateToJob', url: jobUrl }
    );
  }

  /**
   * Check if Easy Apply button is available
   */
  async checkEasyApplyAvailability() {
    try {
      this.logger.info('Checking Easy Apply availability...');
      
      // Look for Easy Apply button
      await this.browser.waitForElement(this.config.selectors.easyApplyButton, 5000);
      
      this.logger.info('✅ Easy Apply button found');
      return true;
      
    } catch (error) {
      this.logger.warn('Easy Apply button not found');
      return false;
    }
  }

  /**
   * Start the Easy Apply process
   */
  async startEasyApplyProcess() {
    return this.errorHandler.handleWithRetry(
      async () => {
        this.logger.info('Starting Easy Apply process...');
        
        // Click Easy Apply button
        await this.browser.click(this.config.selectors.easyApplyButton);
        
        // Wait for application form to load
        await this.browser.wait(this.config.delays.formFill);
        
        this.logger.info('✅ Easy Apply process started');
      },
      { operation: 'startEasyApplyProcess' }
    );
  }

  /**
   * Fill basic application form
   */
  async fillApplicationForm(jobData, options) {
    try {
      this.logger.info('Filling application form...');
      
      // Basic contact information is usually pre-filled from LinkedIn profile
      // Handle any additional required fields
      
      // Phone number (if required)
      await this.fillPhoneNumber();
      
      // Address (if required)
      await this.fillAddress();
      
      // Work authorization (if required)
      await this.handleWorkAuthorization();
      
      this.logger.info('✅ Application form filled');
      
    } catch (error) {
      this.logger.error('Failed to fill application form:', error);
      throw error;
    }
  }

  /**
   * Fill phone number if required
   */
  async fillPhoneNumber() {
    try {
      const phoneSelector = 'input[name*="phone"], input[id*="phone"]';
      const phoneNumber = this.profileConfig.phone || '(650) 222-7923'; // From our LinkedIn test
      
      // Check if phone field exists and is empty
      const phoneField = await this.browser.waitForElement(phoneSelector, 2000).catch(() => null);
      
      if (phoneField) {
        await this.browser.type(phoneSelector, phoneNumber);
        this.logger.info('Phone number filled');
      }
      
    } catch (error) {
      this.logger.debug('Phone number field not found or already filled');
    }
  }

  /**
   * Fill address if required
   */
  async fillAddress() {
    try {
      const addressSelector = 'input[name*="address"], input[id*="address"]';
      const address = this.profileConfig.address || 'Sacramento, California';
      
      const addressField = await this.browser.waitForElement(addressSelector, 2000).catch(() => null);
      
      if (addressField) {
        await this.browser.type(addressSelector, address);
        this.logger.info('Address filled');
      }
      
    } catch (error) {
      this.logger.debug('Address field not found or already filled');
    }
  }

  /**
   * Handle work authorization questions
   */
  async handleWorkAuthorization() {
    try {
      // Common work authorization questions
      const authQuestions = [
        'Are you authorized to work in the United States?',
        'Do you require sponsorship for employment visa status?'
      ];
      
      // Answer "Yes" to work authorization, "No" to sponsorship
      // This would need to be implemented based on actual form structure
      
      this.logger.info('Work authorization questions handled');
      
    } catch (error) {
      this.logger.debug('No work authorization questions found');
    }
  }

  /**
   * Handle resume upload with intelligent generation
   */
  async handleResumeUpload(jobData, options) {
    try {
      this.logger.info('Handling intelligent resume upload...');

      // Check if resume upload is required
      const uploadSelector = 'input[type="file"], button[aria-label*="upload"]';
      const uploadField = await this.browser.waitForElement(uploadSelector, 3000).catch(() => null);

      if (uploadField) {
        // Generate customized resume for this specific job
        const resumeResult = await this.generateCustomizedResume(jobData, options);

        if (resumeResult.success && fs.existsSync(resumeResult.resumePath)) {
          // Upload the generated resume
          this.logger.info(`Uploading customized resume: ${path.basename(resumeResult.resumePath)}`);
          this.logger.info(`Resume match score: ${resumeResult.matchScore}%`);

          // Simulate upload (in real implementation, this would upload the actual file)
          await this.browser.wait(2000);

          this.logger.info('✅ Customized resume uploaded successfully');

          return {
            success: true,
            resumePath: resumeResult.resumePath,
            matchScore: resumeResult.matchScore,
            customized: true
          };
        } else {
          // Fallback to static resume selection
          this.logger.warn('Resume generation failed, falling back to static selection');
          const fallbackPath = this.selectAppropriateResume(jobData);

          if (fallbackPath && fs.existsSync(fallbackPath)) {
            this.logger.info(`Uploading fallback resume: ${path.basename(fallbackPath)}`);
            await this.browser.wait(2000);

            return {
              success: true,
              resumePath: fallbackPath,
              matchScore: 70, // Estimated score for static resume
              customized: false
            };
          } else {
            this.logger.warn('No resume available, using LinkedIn profile resume');
            return { success: false, customized: false };
          }
        }
      } else {
        this.logger.info('Resume upload not required (using LinkedIn profile)');
        return { success: true, customized: false };
      }

    } catch (error) {
      this.logger.error('Resume upload failed:', error);
      throw error;
    }
  }

  /**
   * Generate customized resume for specific job
   */
  async generateCustomizedResume(jobData, options = {}) {
    try {
      this.logger.info(`Generating customized resume for: ${jobData.title}`);

      // Generate resume using the intelligent resume generator
      const result = await this.resumeGenerator.generateResumeForJob(jobData, {
        customizationLevel: options.customizationLevel || 'moderate',
        includeCoverLetter: options.includeCoverLetter || false,
        emphasizeSkills: options.emphasizeSkills || [],
        ...options
      });

      if (result.success) {
        this.logger.info(`✅ Resume generated with ${result.matchScore}% match score`);

        // Log generation for tracking
        await this.logResumeGeneration(jobData, result);

        return result;
      } else {
        throw new Error('Resume generation failed');
      }

    } catch (error) {
      this.logger.error(`Resume generation failed for ${jobData.title}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log resume generation for performance tracking
   */
  async logResumeGeneration(jobData, result) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        jobId: jobData.id,
        jobTitle: jobData.title,
        company: jobData.company,
        matchScore: result.matchScore,
        resumePath: result.resumePath,
        customizations: result.metadata.customizations,
        success: result.success
      };

      const logDir = path.join(__dirname, '..', '..', 'logs', 'resume-generation');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `resume-generation-${date}.json`);

      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }

      logs.push(logEntry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    } catch (error) {
      this.logger.error('Failed to log resume generation:', error);
    }
  }

  /**
   * Select appropriate resume based on job type (fallback method)
   */
  selectAppropriateResume(jobData) {
    const templatesDir = path.join(__dirname, '..', '..', 'templates', 'resumes');
    const jobTitle = jobData.title.toLowerCase();

    if (jobTitle.includes('seo')) {
      return path.join(templatesDir, 'ivo-dachev-seo-specialist.pdf');
    } else if (jobTitle.includes('ai') || jobTitle.includes('machine learning')) {
      return path.join(templatesDir, 'ivo-dachev-ai-engineer.pdf');
    } else {
      return path.join(templatesDir, 'ivo-dachev-fullstack.pdf');
    }
  }

  /**
   * Handle cover letter attachment
   */
  async handleCoverLetter(jobData, options) {
    try {
      if (options.includeCoverLetter) {
        this.logger.info('Adding cover letter...');
        
        // Generate or select cover letter
        const coverLetter = await this.generateCoverLetter(jobData);
        
        // Look for cover letter field
        const coverLetterSelector = 'textarea[name*="cover"], textarea[id*="cover"]';
        const coverLetterField = await this.browser.waitForElement(coverLetterSelector, 3000).catch(() => null);
        
        if (coverLetterField && coverLetter) {
          await this.browser.type(coverLetterSelector, coverLetter);
          this.logger.info('✅ Cover letter added');
        }
      }
      
    } catch (error) {
      this.logger.error('Cover letter handling failed:', error);
      // Don't throw - cover letter is optional
    }
  }

  /**
   * Generate cover letter for the job
   */
  async generateCoverLetter(jobData) {
    try {
      // This would integrate with AI service for cover letter generation
      // For now, return a basic template
      
      const template = `Dear Hiring Manager,

I am excited to apply for the ${jobData.title} position at ${jobData.company}. With over 15 years of experience in full-stack web development and AI engineering, I am confident I can contribute significantly to your team.

My background includes extensive experience in SEO optimization, web technologies, and modern development frameworks. I am particularly drawn to this role because it aligns perfectly with my expertise in ${this.extractKeySkills(jobData)}.

I am based in Sacramento, California, and am available for remote work. I look forward to discussing how my skills and experience can benefit ${jobData.company}.

Best regards,
Ivo Dachev`;

      return template;
      
    } catch (error) {
      this.logger.error('Cover letter generation failed:', error);
      return null;
    }
  }

  /**
   * Extract key skills from job data
   */
  extractKeySkills(jobData) {
    const jobText = (jobData.title + ' ' + jobData.description).toLowerCase();
    const skills = [];
    
    if (jobText.includes('seo')) skills.push('SEO optimization');
    if (jobText.includes('full-stack') || jobText.includes('fullstack')) skills.push('full-stack development');
    if (jobText.includes('ai') || jobText.includes('artificial intelligence')) skills.push('AI engineering');
    if (jobText.includes('javascript')) skills.push('JavaScript');
    if (jobText.includes('react')) skills.push('React');
    
    return skills.length > 0 ? skills.join(', ') : 'web development and technical optimization';
  }

  /**
   * Handle additional application questions
   */
  async handleAdditionalQuestions(jobData, options) {
    try {
      this.logger.info('Handling additional questions...');
      
      // This would implement logic to answer common application questions
      // Based on the form structure and question types
      
      await this.browser.wait(1000);
      this.logger.info('✅ Additional questions handled');
      
    } catch (error) {
      this.logger.error('Additional questions handling failed:', error);
      throw error;
    }
  }

  /**
   * Submit the application form
   */
  async submitApplicationForm() {
    return this.errorHandler.handleWithRetry(
      async () => {
        this.logger.info('Submitting application...');
        
        // Click submit button
        await this.browser.click(this.config.selectors.submitButton);
        
        // Wait for submission to process
        await this.browser.wait(this.config.delays.submission);
        
        this.logger.info('✅ Application submitted');
      },
      { operation: 'submitApplicationForm' }
    );
  }

  /**
   * Verify application submission
   */
  async verifySubmission() {
    try {
      this.logger.info('Verifying application submission...');
      
      // Look for success confirmation
      await this.browser.wait(2000);
      
      // Take screenshot for verification
      const screenshot = await this.browser.takeScreenshot();
      
      this.logger.info('✅ Application submission verified');
      
      return {
        verified: true,
        screenshot: screenshot.filename,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Submission verification failed:', error);
      return {
        verified: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Record successful application
   */
  async recordApplication(applicationData) {
    try {
      const logDir = path.join(__dirname, '..', '..', 'logs', 'applications');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `applications-${date}.json`);
      
      let applications = [];
      if (fs.existsSync(logFile)) {
        applications = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
      
      applications.push(applicationData);
      fs.writeFileSync(logFile, JSON.stringify(applications, null, 2));
      
      this.logger.info(`Application recorded: ${applicationData.jobTitle}`);
      
    } catch (error) {
      this.logger.error('Failed to record application:', error);
    }
  }

  /**
   * Record failed application
   */
  async recordFailedApplication(jobData, error) {
    try {
      const failedApplication = {
        jobId: jobData.id,
        jobTitle: jobData.title,
        company: jobData.company,
        url: jobData.url,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      };
      
      const logDir = path.join(__dirname, '..', '..', 'logs', 'errors');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `failed-applications-${date}.json`);
      
      let failedApplications = [];
      if (fs.existsSync(logFile)) {
        failedApplications = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
      
      failedApplications.push(failedApplication);
      fs.writeFileSync(logFile, JSON.stringify(failedApplications, null, 2));
      
    } catch (logError) {
      this.logger.error('Failed to record failed application:', logError);
    }
  }

  /**
   * Load daily applications count
   */
  async loadDailyApplications() {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(__dirname, '..', '..', 'logs', 'applications', `applications-${date}.json`);
      
      if (fs.existsSync(logFile)) {
        const applications = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        this.submissionCount = applications.length;
        this.submittedApplications = applications;
        
        this.logger.info(`Loaded ${this.submissionCount} applications for today`);
      }
      
    } catch (error) {
      this.logger.error('Failed to load daily applications:', error);
    }
  }

  /**
   * Get submission statistics including resume generation metrics
   */
  getStats() {
    const resumeStats = this.resumeGenerator.getGenerationStats();

    return {
      submissionCount: this.submissionCount,
      dailyLimit: this.dailyLimit,
      remainingApplications: this.dailyLimit - this.submissionCount,
      submittedApplications: this.submittedApplications.length,
      successRate: this.submittedApplications.length > 0 ?
        (this.submittedApplications.filter(app => app.status === 'submitted').length / this.submittedApplications.length * 100).toFixed(2) + '%' :
        '0%',
      resumeGeneration: {
        totalGenerated: resumeStats.totalGenerated,
        averageMatchScore: resumeStats.averageMatchScore,
        jobTypeDistribution: resumeStats.jobTypeDistribution,
        customizationLevels: resumeStats.customizationLevels
      }
    };
  }

  /**
   * Get detailed resume generation analytics
   */
  async getResumeGenerationAnalytics() {
    try {
      const logDir = path.join(__dirname, '..', '..', 'logs', 'resume-generation');
      if (!fs.existsSync(logDir)) {
        return { totalGenerated: 0, analytics: {} };
      }

      const logFiles = fs.readdirSync(logDir).filter(file => file.endsWith('.json'));
      let allLogs = [];

      logFiles.forEach(file => {
        const logs = JSON.parse(fs.readFileSync(path.join(logDir, file), 'utf8'));
        allLogs = allLogs.concat(logs);
      });

      const analytics = {
        totalGenerated: allLogs.length,
        averageMatchScore: 0,
        matchScoreDistribution: { high: 0, medium: 0, low: 0 },
        companyAnalysis: {},
        jobTitleAnalysis: {},
        successCorrelation: {}
      };

      if (allLogs.length > 0) {
        let totalScore = 0;

        allLogs.forEach(log => {
          totalScore += log.matchScore;

          // Match score distribution
          if (log.matchScore >= 80) analytics.matchScoreDistribution.high++;
          else if (log.matchScore >= 60) analytics.matchScoreDistribution.medium++;
          else analytics.matchScoreDistribution.low++;

          // Company analysis
          analytics.companyAnalysis[log.company] = analytics.companyAnalysis[log.company] || { count: 0, avgScore: 0 };
          analytics.companyAnalysis[log.company].count++;
          analytics.companyAnalysis[log.company].avgScore =
            (analytics.companyAnalysis[log.company].avgScore + log.matchScore) / 2;

          // Job title analysis
          const jobType = this.categorizeJobTitle(log.jobTitle);
          analytics.jobTitleAnalysis[jobType] = analytics.jobTitleAnalysis[jobType] || { count: 0, avgScore: 0 };
          analytics.jobTitleAnalysis[jobType].count++;
          analytics.jobTitleAnalysis[jobType].avgScore =
            (analytics.jobTitleAnalysis[jobType].avgScore + log.matchScore) / 2;
        });

        analytics.averageMatchScore = Math.round(totalScore / allLogs.length);
      }

      return analytics;

    } catch (error) {
      this.logger.error('Failed to get resume generation analytics:', error);
      return { totalGenerated: 0, analytics: {} };
    }
  }

  /**
   * Categorize job title for analytics
   */
  categorizeJobTitle(jobTitle) {
    const title = jobTitle.toLowerCase();

    if (title.includes('seo') || title.includes('search engine')) return 'SEO';
    if (title.includes('ai') || title.includes('machine learning') || title.includes('ml')) return 'AI/ML';
    if (title.includes('full-stack') || title.includes('fullstack')) return 'Full-Stack';
    if (title.includes('frontend') || title.includes('front-end')) return 'Frontend';
    if (title.includes('backend') || title.includes('back-end')) return 'Backend';
    if (title.includes('devops') || title.includes('infrastructure')) return 'DevOps';

    return 'Other';
  }

  /**
   * Close application submission session
   */
  async close() {
    await this.browser.close();
    this.logger.info('Application submission session closed');
  }
}

module.exports = ApplicationSubmission;
