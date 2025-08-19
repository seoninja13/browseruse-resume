/**
 * Resume Generation Module - Intelligent Resume Customization
 * 
 * Dynamically generates tailored resumes based on job descriptions using
 * NLP analysis and intelligent content optimization.
 * 
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Logger, ErrorHandler } = require('./error-handling');

class ResumeGenerator {
  constructor() {
    this.logger = new Logger('ResumeGenerator');
    this.errorHandler = new ErrorHandler();
    this.baseTemplatePath = path.join(__dirname, '..', '..', 'templates', 'resumes', 'base-template');
    this.generatedPath = path.join(__dirname, '..', '..', 'templates', 'resumes', 'generated');
    this.metadataPath = path.join(__dirname, '..', '..', 'templates', 'resumes', 'metadata');

    // Load base data from updated master file
    this.masterData = this.loadMasterData();
    this.skillsDatabase = this.loadSkillsDatabase();

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Load master resume data
   */
  loadMasterData() {
    try {
      // Try to load the updated master data file first
      const updatedMasterPath = path.join(this.baseTemplatePath, 'ivo-dachev-master-updated.json');
      const originalMasterPath = path.join(this.baseTemplatePath, 'ivo-dachev-master.json');

      let masterPath = updatedMasterPath;
      if (!fs.existsSync(updatedMasterPath)) {
        this.logger.warn('Updated master data file not found, falling back to original');
        masterPath = originalMasterPath;
      }

      const data = fs.readFileSync(masterPath, 'utf8');
      const masterData = JSON.parse(data);
      this.logger.info(`✅ Master resume data loaded from: ${path.basename(masterPath)}`);

      return masterData;
    } catch (error) {
      this.logger.error('Failed to load master resume data:', error);
      throw new Error('Master resume data not found');
    }
  }

  /**
   * Load skills database
   */
  loadSkillsDatabase() {
    try {
      const skillsPath = path.join(this.baseTemplatePath, 'skills-database.json');
      const data = fs.readFileSync(skillsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Failed to load skills database:', error);
      throw new Error('Skills database not found');
    }
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.generatedPath, this.metadataPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate customized resume for specific job
   */
  async generateResumeForJob(jobData, options = {}) {
    try {
      this.logger.info(`Generating resume for job: ${jobData.title} at ${jobData.company}`);
      
      // Analyze job description
      const jobAnalysis = await this.analyzeJobDescription(jobData);
      
      // Generate customized content
      const customizedResume = await this.customizeResumeContent(jobAnalysis, options);
      
      // Generate file names
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('-').substring(0, 19);
      const baseFileName = `ivo-dachev-${jobData.id}-${timestamp}`;
      
      // Save resume data
      const resumeDataPath = path.join(this.generatedPath, `${baseFileName}.json`);
      fs.writeFileSync(resumeDataPath, JSON.stringify(customizedResume, null, 2));
      
      // Generate PDF (placeholder - would integrate with PDF generation library)
      const pdfPath = await this.generatePDF(customizedResume, baseFileName);
      
      // Save metadata
      const metadata = {
        jobId: jobData.id,
        jobTitle: jobData.title,
        company: jobData.company,
        generatedAt: new Date().toISOString(),
        jobAnalysis: jobAnalysis,
        customizations: customizedResume.customizations,
        filePaths: {
          json: resumeDataPath,
          pdf: pdfPath
        }
      };
      
      const metadataPath = path.join(this.metadataPath, `${baseFileName}-metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      this.logger.info(`✅ Resume generated successfully: ${baseFileName}.pdf`);
      
      return {
        success: true,
        resumePath: pdfPath,
        metadata: metadata,
        matchScore: jobAnalysis.overallMatchScore
      };
      
    } catch (error) {
      this.logger.error('Resume generation failed:', error);
      throw new Error(`Resume generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze job description to extract requirements
   */
  async analyzeJobDescription(jobData) {
    try {
      this.logger.info('Analyzing job description...');
      
      const jobText = `${jobData.title} ${jobData.description || ''} ${jobData.company}`.toLowerCase();
      
      // Extract job type
      const jobType = this.determineJobType(jobText);
      
      // Extract required skills
      const requiredSkills = this.extractRequiredSkills(jobText);
      
      // Extract experience requirements
      const experienceRequirements = this.extractExperienceRequirements(jobText);
      
      // Calculate match scores
      const skillMatchScores = this.calculateSkillMatches(requiredSkills);
      
      // Determine overall match score
      const overallMatchScore = this.calculateOverallMatchScore(skillMatchScores, experienceRequirements);
      
      const analysis = {
        jobType: jobType,
        requiredSkills: requiredSkills,
        experienceRequirements: experienceRequirements,
        skillMatchScores: skillMatchScores,
        overallMatchScore: overallMatchScore,
        primaryFocus: this.determinePrimaryFocus(requiredSkills, jobType),
        customizationLevel: this.determineCustomizationLevel(overallMatchScore)
      };
      
      this.logger.info(`Job analysis completed. Type: ${jobType}, Match: ${overallMatchScore}%`);
      
      return analysis;
      
    } catch (error) {
      this.logger.error('Job analysis failed:', error);
      throw error;
    }
  }

  /**
   * Determine job type from job description
   */
  determineJobType(jobText) {
    const jobTypeKeywords = this.skillsDatabase.jobTypeMapping;
    let bestMatch = 'fullstack';
    let highestScore = 0;
    
    for (const [jobType, mapping] of Object.entries(jobTypeKeywords)) {
      let score = 0;
      
      mapping.keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          score += 1;
        }
      });
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = jobType;
      }
    }
    
    return bestMatch;
  }

  /**
   * Extract required skills from job description
   */
  extractRequiredSkills(jobText) {
    const requiredSkills = [];
    
    // Check all skills in database
    Object.values(this.skillsDatabase.skillCategories).forEach(category => {
      Object.entries(category.skills).forEach(([skillName, skillData]) => {
        // Check main skill name
        if (jobText.includes(skillName.toLowerCase())) {
          requiredSkills.push({
            name: skillName,
            category: category.displayName,
            proficiency: skillData.proficiency,
            priority: 'high'
          });
        }
        
        // Check aliases
        skillData.aliases.forEach(alias => {
          if (jobText.includes(alias.toLowerCase())) {
            requiredSkills.push({
              name: skillName,
              category: category.displayName,
              proficiency: skillData.proficiency,
              priority: 'medium'
            });
          }
        });
        
        // Check keywords
        skillData.keywords.forEach(keyword => {
          if (jobText.includes(keyword)) {
            requiredSkills.push({
              name: skillName,
              category: category.displayName,
              proficiency: skillData.proficiency,
              priority: 'low'
            });
          }
        });
      });
    });
    
    // Remove duplicates and sort by priority
    const uniqueSkills = requiredSkills.reduce((acc, skill) => {
      const existing = acc.find(s => s.name === skill.name);
      if (!existing || skill.priority === 'high') {
        acc = acc.filter(s => s.name !== skill.name);
        acc.push(skill);
      }
      return acc;
    }, []);
    
    return uniqueSkills.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Extract experience requirements
   */
  extractExperienceRequirements(jobText) {
    const requirements = {
      yearsRequired: 0,
      seniorityLevel: 'mid',
      specificExperience: []
    };
    
    // Extract years of experience
    const yearsMatch = jobText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
    if (yearsMatch) {
      requirements.yearsRequired = parseInt(yearsMatch[1]);
    }
    
    // Determine seniority level
    if (jobText.includes('senior') || jobText.includes('lead') || jobText.includes('principal')) {
      requirements.seniorityLevel = 'senior';
    } else if (jobText.includes('junior') || jobText.includes('entry')) {
      requirements.seniorityLevel = 'junior';
    }
    
    // Extract specific experience requirements
    const experienceKeywords = [
      'leadership', 'team lead', 'mentoring', 'architecture', 'design',
      'scalability', 'performance', 'optimization', 'deployment', 'ci/cd'
    ];
    
    experienceKeywords.forEach(keyword => {
      if (jobText.includes(keyword)) {
        requirements.specificExperience.push(keyword);
      }
    });
    
    return requirements;
  }

  /**
   * Calculate skill match scores
   */
  calculateSkillMatches(requiredSkills) {
    const matches = {};
    
    requiredSkills.forEach(skill => {
      const masterSkill = this.findSkillInMaster(skill.name);
      if (masterSkill) {
        matches[skill.name] = {
          required: true,
          proficiency: masterSkill.proficiency,
          years: masterSkill.years,
          matchScore: this.calculateSkillMatchScore(skill, masterSkill)
        };
      } else {
        matches[skill.name] = {
          required: true,
          proficiency: 0,
          years: 0,
          matchScore: 0
        };
      }
    });
    
    return matches;
  }

  /**
   * Find skill in master data
   */
  findSkillInMaster(skillName) {
    const allSkills = this.masterData.technicalSkills;
    
    for (const category of Object.values(allSkills)) {
      if (category[skillName]) {
        return category[skillName];
      }
    }
    
    return null;
  }

  /**
   * Calculate individual skill match score
   */
  calculateSkillMatchScore(requiredSkill, masterSkill) {
    if (!masterSkill) return 0;
    
    let score = 0;
    
    // Proficiency score (40% weight)
    score += (masterSkill.proficiency / 100) * 40;
    
    // Experience score (40% weight)
    const experienceScore = Math.min(masterSkill.years / 5, 1) * 40;
    score += experienceScore;
    
    // Priority bonus (20% weight)
    const priorityBonus = requiredSkill.priority === 'high' ? 20 : 
                         requiredSkill.priority === 'medium' ? 15 : 10;
    score += priorityBonus;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate overall match score
   */
  calculateOverallMatchScore(skillMatches, experienceRequirements) {
    const skillScores = Object.values(skillMatches).map(match => match.matchScore);
    const averageSkillScore = skillScores.length > 0 ? 
      skillScores.reduce((sum, score) => sum + score, 0) / skillScores.length : 0;
    
    // Experience match score
    const masterExperience = parseInt(this.masterData.personalInfo.experience);
    const experienceMatch = experienceRequirements.yearsRequired > 0 ? 
      Math.min(masterExperience / experienceRequirements.yearsRequired, 1) * 100 : 100;
    
    // Weighted overall score
    const overallScore = (averageSkillScore * 0.7) + (experienceMatch * 0.3);
    
    return Math.round(overallScore);
  }

  /**
   * Determine primary focus for customization
   */
  determinePrimaryFocus(requiredSkills, jobType) {
    const topSkills = requiredSkills.slice(0, 5).map(skill => skill.name);
    
    return {
      jobType: jobType,
      primarySkills: topSkills,
      focusAreas: this.identifyFocusAreas(requiredSkills)
    };
  }

  /**
   * Identify focus areas for customization
   */
  identifyFocusAreas(requiredSkills) {
    const categoryCount = {};
    
    requiredSkills.forEach(skill => {
      categoryCount[skill.category] = (categoryCount[skill.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  /**
   * Determine customization level based on match score
   */
  determineCustomizationLevel(matchScore) {
    if (matchScore >= 90) return 'minimal';
    if (matchScore >= 70) return 'moderate';
    if (matchScore >= 50) return 'aggressive';
    return 'extensive';
  }

  /**
   * Customize resume content based on job analysis
   */
  async customizeResumeContent(jobAnalysis, options = {}) {
    try {
      this.logger.info(`Customizing resume content (${jobAnalysis.customizationLevel} level)...`);
      
      const customizedResume = JSON.parse(JSON.stringify(this.masterData));
      
      // Customize professional summary
      customizedResume.professionalSummary = this.customizeProfessionalSummary(jobAnalysis);
      
      // Customize work experience (last two positions)
      customizedResume.workExperience = this.customizeWorkExperience(jobAnalysis);
      
      // Customize technical skills
      customizedResume.technicalSkills = this.customizeTechnicalSkills(jobAnalysis);
      
      // Add customization metadata
      customizedResume.customizations = {
        level: jobAnalysis.customizationLevel,
        focusAreas: jobAnalysis.primaryFocus.focusAreas,
        primarySkills: jobAnalysis.primaryFocus.primarySkills,
        matchScore: jobAnalysis.overallMatchScore,
        customizedAt: new Date().toISOString()
      };
      
      this.logger.info('✅ Resume content customization completed');
      
      return customizedResume;
      
    } catch (error) {
      this.logger.error('Resume customization failed:', error);
      throw error;
    }
  }

  /**
   * Customize professional summary
   */
  customizeProfessionalSummary(jobAnalysis) {
    const jobType = jobAnalysis.jobType;
    const baseSummary = this.masterData.professionalSummaries[jobType] || 
                       this.masterData.professionalSummaries.hybrid;
    
    // Add job-specific keywords and focus areas
    let customizedSummary = baseSummary;
    
    // Emphasize top skills
    const topSkills = jobAnalysis.primaryFocus.primarySkills.slice(0, 3);
    if (topSkills.length > 0) {
      const skillsText = topSkills.join(', ');
      customizedSummary = customizedSummary.replace(
        /expertise in [^.]+/i,
        `expertise in ${skillsText} and modern development technologies`
      );
    }
    
    return customizedSummary;
  }

  /**
   * Customize work experience descriptions
   */
  customizeWorkExperience(jobAnalysis) {
    const workExperience = JSON.parse(JSON.stringify(this.masterData.workExperience));
    const jobType = jobAnalysis.jobType;
    
    // Customize last two positions
    for (let i = 0; i < Math.min(2, workExperience.length); i++) {
      const position = workExperience[i];
      
      if (position.descriptions[jobType]) {
        position.description = position.descriptions[jobType];
      } else {
        position.description = position.descriptions.hybrid || position.descriptions.fullstack;
      }
      
      // Remove the descriptions object to clean up
      delete position.descriptions;
    }
    
    return workExperience;
  }

  /**
   * Customize technical skills based on job requirements
   */
  customizeTechnicalSkills(jobAnalysis) {
    const skills = JSON.parse(JSON.stringify(this.masterData.technicalSkills));
    const requiredSkills = jobAnalysis.requiredSkills.map(skill => skill.name);
    
    // Reorder skills to prioritize job requirements
    Object.keys(skills).forEach(category => {
      const categorySkills = skills[category];
      const sortedSkills = {};

      // First add required skills
      requiredSkills.forEach(skillName => {
        if (categorySkills[skillName] !== undefined) {
          // Convert number to skill object if needed
          const skillValue = typeof categorySkills[skillName] === 'number'
            ? { score: categorySkills[skillName], highlighted: true }
            : { ...categorySkills[skillName], highlighted: true };
          sortedSkills[skillName] = skillValue;
        }
      });

      // Then add remaining skills
      Object.keys(categorySkills).forEach(skillName => {
        if (!sortedSkills[skillName]) {
          // Convert number to skill object if needed
          const skillValue = typeof categorySkills[skillName] === 'number'
            ? { score: categorySkills[skillName], highlighted: false }
            : { ...categorySkills[skillName], highlighted: false };
          sortedSkills[skillName] = skillValue;
        }
      });

      skills[category] = sortedSkills;
    });
    
    return skills;
  }

  /**
   * Generate PDF from resume data using Puppeteer
   */
  async generatePDF(resumeData, baseFileName) {
    try {
      this.logger.info('Generating PDF resume...');

      const pdfPath = path.join(this.generatedPath, `${baseFileName}.pdf`);

      // Create HTML content for the resume
      const htmlContent = this.convertToHTML(resumeData);

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with professional formatting
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      await browser.close();

      // Also create text version for fallback
      const resumeText = this.convertToText(resumeData);
      fs.writeFileSync(pdfPath.replace('.pdf', '.txt'), resumeText);

      this.logger.info('✅ PDF generation completed successfully');

      return pdfPath;

    } catch (error) {
      this.logger.error('PDF generation failed:', error);

      // Fallback to text file if PDF generation fails
      const textPath = path.join(this.generatedPath, `${baseFileName}.txt`);
      const resumeText = this.convertToText(resumeData);
      fs.writeFileSync(textPath, resumeText);

      this.logger.warn('PDF generation failed, created text file as fallback');
      return textPath;
    }
  }

  /**
   * Convert resume data to professional HTML format for PDF generation
   */
  convertToHTML(resumeData) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.personalInfo.name} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            font-size: 11pt;
        }

        .container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 15px;
        }

        .name {
            font-size: 24pt;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .title {
            font-size: 14pt;
            color: #34495e;
            margin-bottom: 8px;
        }

        .contact-info {
            font-size: 10pt;
            color: #7f8c8d;
        }

        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 3px;
            margin-bottom: 10px;
        }

        .summary {
            text-align: justify;
            margin-bottom: 15px;
        }

        .job {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }

        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 5px;
        }

        .job-title {
            font-weight: bold;
            font-size: 11pt;
        }

        .job-company {
            font-weight: bold;
            color: #2c3e50;
        }

        .job-dates {
            font-style: italic;
            color: #7f8c8d;
            font-size: 10pt;
        }

        .job-location {
            color: #7f8c8d;
            font-size: 10pt;
            margin-bottom: 5px;
        }

        .job-description {
            margin-left: 0;
        }

        .job-description li {
            margin-bottom: 3px;
            list-style-type: disc;
            margin-left: 20px;
        }

        .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .skill-category {
            margin-bottom: 8px;
        }

        .skill-category-title {
            font-weight: bold;
            color: #2c3e50;
            font-size: 10pt;
        }

        .skill-list {
            color: #34495e;
            font-size: 10pt;
        }

        @media print {
            body { print-color-adjust: exact; }
            .container { padding: 0.3in; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="name">${resumeData.personalInfo.name}</div>
            <div class="title">${resumeData.personalInfo.title}</div>
            <div class="contact-info">
                ${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone}<br>
                ${resumeData.personalInfo.location}
            </div>
        </div>

        <!-- Professional Summary -->
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <div class="summary">${resumeData.professionalSummary}</div>
        </div>

        <!-- Work Experience -->
        <div class="section">
            <div class="section-title">Work Experience</div>
            ${resumeData.workExperience.map(job => `
                <div class="job">
                    <div class="job-header">
                        <div>
                            <span class="job-title">${job.position}</span> -
                            <span class="job-company">${job.company}</span>
                        </div>
                        <div class="job-dates">
                            ${this.formatDateForDisplay(job.startDate)} - ${job.current ? 'Present' : this.formatDateForDisplay(job.endDate)}
                        </div>
                    </div>
                    ${job.location ? `<div class="job-location">${job.location}</div>` : ''}
                    <ul class="job-description">
                        ${job.description ? job.description.map(desc => `<li>${desc}</li>`).join('') : ''}
                    </ul>
                </div>
            `).join('')}
        </div>

        <!-- Technical Skills -->
        <div class="section">
            <div class="section-title">Technical Skills</div>
            <div class="skills-grid">
                ${Object.entries(resumeData.technicalSkills).map(([category, skills]) => `
                    <div class="skill-category">
                        <div class="skill-category-title">${this.formatSkillCategoryName(category)}:</div>
                        <div class="skill-list">${Object.keys(skills).slice(0, 8).join(', ')}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Format skill category names for display
   */
  formatSkillCategoryName(category) {
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Convert resume data to text format (fallback for PDF generation)
   */
  convertToText(resumeData) {
    let text = '';
    
    // Personal Info
    text += `${resumeData.personalInfo.name}\n`;
    text += `${resumeData.personalInfo.title}\n`;
    text += `${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone}\n`;
    text += `${resumeData.personalInfo.location}\n\n`;
    
    // Professional Summary
    text += 'PROFESSIONAL SUMMARY\n';
    text += `${resumeData.professionalSummary}\n\n`;
    
    // Work Experience
    text += 'WORK EXPERIENCE\n';
    resumeData.workExperience.forEach(job => {
      text += `${job.position} - ${job.company}\n`;
      text += `${this.formatDateForDisplay(job.startDate)} - ${job.current ? 'Present' : this.formatDateForDisplay(job.endDate)}\n`;
      if (job.description) {
        job.description.forEach(desc => {
          text += `• ${desc}\n`;
        });
      }
      text += '\n';
    });
    
    // Technical Skills
    text += 'TECHNICAL SKILLS\n';
    Object.entries(resumeData.technicalSkills).forEach(([category, skills]) => {
      const skillNames = Object.keys(skills).slice(0, 8).join(', ');
      text += `${category}: ${skillNames}\n`;
    });
    
    return text;
  }

  /**
   * Format date from "YYYY-MM" or "Month YYYY" to "Month YYYY" format
   */
  formatDateForDisplay(dateString) {
    if (!dateString || dateString === 'Present') {
      return dateString;
    }

    // If already in "Month YYYY" format, return as is
    if (!/^\d{4}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Convert from "YYYY-MM" to "Month YYYY"
    const [year, month] = dateString.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }

    return dateString; // Return original if parsing fails
  }

  /**
   * Get generation statistics
   */
  getGenerationStats() {
    try {
      const metadataFiles = fs.readdirSync(this.metadataPath)
        .filter(file => file.endsWith('-metadata.json'));
      
      const stats = {
        totalGenerated: metadataFiles.length,
        averageMatchScore: 0,
        jobTypeDistribution: {},
        customizationLevels: {}
      };
      
      if (metadataFiles.length > 0) {
        let totalMatchScore = 0;
        
        metadataFiles.forEach(file => {
          const metadata = JSON.parse(fs.readFileSync(path.join(this.metadataPath, file), 'utf8'));
          
          totalMatchScore += metadata.jobAnalysis.overallMatchScore;
          
          const jobType = metadata.jobAnalysis.jobType;
          stats.jobTypeDistribution[jobType] = (stats.jobTypeDistribution[jobType] || 0) + 1;
          
          const customizationLevel = metadata.jobAnalysis.customizationLevel;
          stats.customizationLevels[customizationLevel] = (stats.customizationLevels[customizationLevel] || 0) + 1;
        });
        
        stats.averageMatchScore = Math.round(totalMatchScore / metadataFiles.length);
      }
      
      return stats;
      
    } catch (error) {
      this.logger.error('Failed to get generation stats:', error);
      return { totalGenerated: 0, averageMatchScore: 0 };
    }
  }
}

module.exports = ResumeGenerator;
