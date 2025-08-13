/**
 * Job Description Analysis Module - Advanced NLP for Job Requirements
 * 
 * Provides sophisticated analysis of job descriptions to extract requirements,
 * skills, company culture, and other relevant information for resume customization.
 * 
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 1.0.0
 */

const { Logger } = require('./error-handling');
const fs = require('fs');
const path = require('path');

class JobDescriptionAnalyzer {
  constructor() {
    this.logger = new Logger('JobDescriptionAnalyzer');
    this.skillsDatabase = this.loadSkillsDatabase();
    this.companyKeywords = this.loadCompanyKeywords();
    this.experiencePatterns = this.loadExperiencePatterns();
  }

  /**
   * Load skills database for analysis
   */
  loadSkillsDatabase() {
    try {
      const skillsPath = path.join(__dirname, '..', '..', 'templates', 'resumes', 'base-template', 'skills-database.json');
      const data = fs.readFileSync(skillsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Failed to load skills database:', error);
      return { skillCategories: {}, jobTypeMapping: {} };
    }
  }

  /**
   * Load company culture keywords
   */
  loadCompanyKeywords() {
    return {
      culture: {
        innovative: ['innovative', 'cutting-edge', 'disruptive', 'pioneering', 'breakthrough'],
        collaborative: ['collaborative', 'team-oriented', 'cross-functional', 'partnership', 'teamwork'],
        fastPaced: ['fast-paced', 'dynamic', 'agile', 'rapid', 'quick-moving'],
        datadriven: ['data-driven', 'analytics', 'metrics', 'evidence-based', 'quantitative'],
        customerFocused: ['customer-focused', 'user-centric', 'client-oriented', 'customer-first'],
        growth: ['growth', 'scaling', 'expansion', 'development', 'advancement']
      },
      benefits: {
        remote: ['remote', 'work from home', 'distributed', 'flexible location'],
        flexible: ['flexible hours', 'work-life balance', 'flexible schedule', 'autonomy'],
        learning: ['learning', 'professional development', 'training', 'education', 'growth'],
        equity: ['equity', 'stock options', 'ownership', 'shares', 'vesting'],
        health: ['health insurance', 'medical', 'dental', 'vision', 'healthcare'],
        retirement: ['401k', 'retirement', 'pension', 'savings plan']
      },
      companySize: {
        startup: ['startup', 'early-stage', 'seed', 'series a', 'series b'],
        midsize: ['mid-size', 'growing', 'established', '100-500', '500-1000'],
        enterprise: ['enterprise', 'fortune 500', 'large corporation', '1000+', 'multinational']
      }
    };
  }

  /**
   * Load experience requirement patterns
   */
  loadExperiencePatterns() {
    return {
      years: [
        /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi,
        /(\d+)\+?\s*year\s*(of\s*)?(experience|exp)/gi,
        /minimum\s*(\d+)\s*years?/gi,
        /at\s*least\s*(\d+)\s*years?/gi
      ],
      seniority: {
        junior: ['junior', 'entry-level', 'associate', 'graduate', 'new grad'],
        mid: ['mid-level', 'intermediate', 'experienced', '3-5 years', '2-4 years'],
        senior: ['senior', 'lead', 'principal', 'staff', 'expert', '5+ years', '7+ years'],
        executive: ['director', 'vp', 'head of', 'chief', 'executive']
      },
      leadership: ['leadership', 'team lead', 'manage', 'mentor', 'supervise', 'direct'],
      architecture: ['architecture', 'design', 'system design', 'technical design', 'scalability']
    };
  }

  /**
   * Comprehensive job description analysis
   */
  async analyzeJobDescription(jobData) {
    try {
      this.logger.info(`Analyzing job description for: ${jobData.title}`);
      
      const jobText = this.prepareJobText(jobData);
      
      const analysis = {
        basicInfo: this.extractBasicInfo(jobData),
        skills: this.extractSkills(jobText),
        experience: this.extractExperienceRequirements(jobText),
        company: this.analyzeCompanyInfo(jobText, jobData.company),
        jobType: this.determineJobType(jobText),
        priorities: this.determinePriorities(jobText),
        culture: this.analyzeCulture(jobText),
        benefits: this.extractBenefits(jobText),
        requirements: this.extractRequirements(jobText),
        preferences: this.extractPreferences(jobText)
      };
      
      // Calculate overall scores
      analysis.scores = this.calculateAnalysisScores(analysis);
      
      this.logger.info(`✅ Job analysis completed. Type: ${analysis.jobType}, Skills: ${analysis.skills.required.length}`);
      
      return analysis;
      
    } catch (error) {
      this.logger.error('Job description analysis failed:', error);
      throw error;
    }
  }

  /**
   * Prepare job text for analysis
   */
  prepareJobText(jobData) {
    let text = '';
    
    if (jobData.title) text += jobData.title + ' ';
    if (jobData.description) text += jobData.description + ' ';
    if (jobData.company) text += jobData.company + ' ';
    if (jobData.requirements) text += jobData.requirements + ' ';
    
    return text.toLowerCase();
  }

  /**
   * Extract basic job information
   */
  extractBasicInfo(jobData) {
    return {
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      salary: jobData.salary,
      posted: jobData.posted,
      applicants: jobData.applicants,
      easyApply: jobData.easyApply,
      remote: this.isRemoteJob(jobData)
    };
  }

  /**
   * Check if job is remote
   */
  isRemoteJob(jobData) {
    const text = `${jobData.title} ${jobData.location} ${jobData.description || ''}`.toLowerCase();
    return text.includes('remote') || text.includes('work from home') || text.includes('distributed');
  }

  /**
   * Extract required and preferred skills
   */
  extractSkills(jobText) {
    const skills = {
      required: [],
      preferred: [],
      categories: {}
    };
    
    // Analyze each skill category
    Object.entries(this.skillsDatabase.skillCategories).forEach(([categoryKey, category]) => {
      const categorySkills = [];
      
      Object.entries(category.skills).forEach(([skillName, skillData]) => {
        const skillInfo = this.analyzeSkillMention(jobText, skillName, skillData);
        
        if (skillInfo.mentioned) {
          const skill = {
            name: skillName,
            category: category.displayName,
            priority: skillInfo.priority,
            mentions: skillInfo.mentions,
            context: skillInfo.context
          };
          
          if (skillInfo.priority === 'required') {
            skills.required.push(skill);
          } else {
            skills.preferred.push(skill);
          }
          
          categorySkills.push(skill);
        }
      });
      
      if (categorySkills.length > 0) {
        skills.categories[category.displayName] = categorySkills;
      }
    });
    
    // Sort by priority and mentions
    skills.required.sort((a, b) => b.mentions - a.mentions);
    skills.preferred.sort((a, b) => b.mentions - a.mentions);
    
    return skills;
  }

  /**
   * Analyze skill mention in job text
   */
  analyzeSkillMention(jobText, skillName, skillData) {
    let mentions = 0;
    let priority = 'preferred';
    let context = [];
    
    // Check main skill name
    const skillRegex = new RegExp(`\\b${skillName.toLowerCase()}\\b`, 'gi');
    const skillMatches = jobText.match(skillRegex);
    if (skillMatches) {
      mentions += skillMatches.length;
    }
    
    // Check aliases
    skillData.aliases.forEach(alias => {
      const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'gi');
      const aliasMatches = jobText.match(aliasRegex);
      if (aliasMatches) {
        mentions += aliasMatches.length;
      }
    });
    
    // Check keywords
    skillData.keywords.forEach(keyword => {
      if (jobText.includes(keyword.toLowerCase())) {
        mentions += 0.5; // Keywords count as half mentions
      }
    });
    
    // Determine priority based on context
    if (mentions > 0) {
      const requiredContext = ['required', 'must have', 'essential', 'mandatory', 'need'];
      const preferredContext = ['preferred', 'nice to have', 'bonus', 'plus', 'advantage'];
      
      requiredContext.forEach(ctx => {
        if (jobText.includes(ctx) && jobText.includes(skillName.toLowerCase())) {
          priority = 'required';
          context.push(ctx);
        }
      });
      
      preferredContext.forEach(ctx => {
        if (jobText.includes(ctx) && jobText.includes(skillName.toLowerCase())) {
          if (priority !== 'required') priority = 'preferred';
          context.push(ctx);
        }
      });
    }
    
    return {
      mentioned: mentions > 0,
      mentions: Math.round(mentions),
      priority: priority,
      context: context
    };
  }

  /**
   * Extract experience requirements
   */
  extractExperienceRequirements(jobText) {
    const requirements = {
      yearsRequired: 0,
      seniorityLevel: 'mid',
      specificExperience: [],
      leadership: false,
      architecture: false
    };
    
    // Extract years of experience
    this.experiencePatterns.years.forEach(pattern => {
      const matches = jobText.match(pattern);
      if (matches) {
        const years = parseInt(matches[1]);
        if (years > requirements.yearsRequired) {
          requirements.yearsRequired = years;
        }
      }
    });
    
    // Determine seniority level
    Object.entries(this.experiencePatterns.seniority).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          requirements.seniorityLevel = level;
        }
      });
    });
    
    // Check for leadership requirements
    this.experiencePatterns.leadership.forEach(keyword => {
      if (jobText.includes(keyword)) {
        requirements.leadership = true;
        requirements.specificExperience.push(keyword);
      }
    });
    
    // Check for architecture requirements
    this.experiencePatterns.architecture.forEach(keyword => {
      if (jobText.includes(keyword)) {
        requirements.architecture = true;
        requirements.specificExperience.push(keyword);
      }
    });
    
    return requirements;
  }

  /**
   * Analyze company information and culture
   */
  analyzeCompanyInfo(jobText, companyName) {
    const analysis = {
      name: companyName,
      size: 'unknown',
      culture: [],
      industry: 'technology'
    };
    
    // Determine company size
    Object.entries(this.companyKeywords.companySize).forEach(([size, keywords]) => {
      keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          analysis.size = size;
        }
      });
    });
    
    // Analyze culture keywords
    Object.entries(this.companyKeywords.culture).forEach(([trait, keywords]) => {
      keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          analysis.culture.push(trait);
        }
      });
    });
    
    return analysis;
  }

  /**
   * Determine primary job type
   */
  determineJobType(jobText) {
    const jobTypeScores = {};
    
    Object.entries(this.skillsDatabase.jobTypeMapping).forEach(([jobType, mapping]) => {
      let score = 0;
      
      mapping.keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          score += 2;
        }
      });
      
      mapping.primarySkills.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          score += 3;
        }
      });
      
      mapping.secondarySkills.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          score += 1;
        }
      });
      
      jobTypeScores[jobType] = score;
    });
    
    // Return job type with highest score
    const bestMatch = Object.entries(jobTypeScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return bestMatch ? bestMatch[0] : 'fullstack';
  }

  /**
   * Determine skill and requirement priorities
   */
  determinePriorities(jobText) {
    const priorities = {
      mustHave: [],
      important: [],
      niceToHave: []
    };
    
    // Extract must-have requirements
    const mustHavePatterns = [
      /required:?\s*([^.]+)/gi,
      /must have:?\s*([^.]+)/gi,
      /essential:?\s*([^.]+)/gi
    ];
    
    mustHavePatterns.forEach(pattern => {
      const matches = jobText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          priorities.mustHave.push(match.trim());
        });
      }
    });
    
    // Extract preferred requirements
    const preferredPatterns = [
      /preferred:?\s*([^.]+)/gi,
      /nice to have:?\s*([^.]+)/gi,
      /bonus:?\s*([^.]+)/gi
    ];
    
    preferredPatterns.forEach(pattern => {
      const matches = jobText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          priorities.niceToHave.push(match.trim());
        });
      }
    });
    
    return priorities;
  }

  /**
   * Analyze company culture indicators
   */
  analyzeCulture(jobText) {
    const culture = {
      traits: [],
      values: [],
      workStyle: []
    };
    
    Object.entries(this.companyKeywords.culture).forEach(([trait, keywords]) => {
      keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          culture.traits.push(trait);
        }
      });
    });
    
    return culture;
  }

  /**
   * Extract benefits and perks
   */
  extractBenefits(jobText) {
    const benefits = [];
    
    Object.entries(this.companyKeywords.benefits).forEach(([benefit, keywords]) => {
      keywords.forEach(keyword => {
        if (jobText.includes(keyword)) {
          benefits.push(benefit);
        }
      });
    });
    
    return benefits;
  }

  /**
   * Extract hard requirements
   */
  extractRequirements(jobText) {
    const requirements = {
      education: [],
      certifications: [],
      experience: [],
      technical: []
    };
    
    // Education requirements
    const educationKeywords = ['degree', 'bachelor', 'master', 'phd', 'computer science', 'engineering'];
    educationKeywords.forEach(keyword => {
      if (jobText.includes(keyword)) {
        requirements.education.push(keyword);
      }
    });
    
    // Certification requirements
    const certKeywords = ['certified', 'certification', 'aws', 'azure', 'google cloud', 'kubernetes'];
    certKeywords.forEach(keyword => {
      if (jobText.includes(keyword)) {
        requirements.certifications.push(keyword);
      }
    });
    
    return requirements;
  }

  /**
   * Extract preferences (nice-to-have)
   */
  extractPreferences(jobText) {
    const preferences = [];
    
    const preferencePatterns = [
      /preferred:?\s*([^.]+)/gi,
      /nice to have:?\s*([^.]+)/gi,
      /bonus:?\s*([^.]+)/gi,
      /plus:?\s*([^.]+)/gi
    ];
    
    preferencePatterns.forEach(pattern => {
      const matches = jobText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          preferences.push(match.trim());
        });
      }
    });
    
    return preferences;
  }

  /**
   * Calculate analysis scores
   */
  calculateAnalysisScores(analysis) {
    const scores = {
      skillMatch: 0,
      experienceMatch: 0,
      cultureMatch: 0,
      overall: 0
    };
    
    // Skill match score (based on required skills found)
    const totalSkills = analysis.skills.required.length + analysis.skills.preferred.length;
    if (totalSkills > 0) {
      scores.skillMatch = Math.round((analysis.skills.required.length / totalSkills) * 100);
    }
    
    // Experience match score (simplified)
    scores.experienceMatch = analysis.experience.yearsRequired <= 15 ? 100 : 80;
    
    // Culture match score (based on culture traits identified)
    scores.cultureMatch = analysis.culture.traits.length > 0 ? 85 : 70;
    
    // Overall score
    scores.overall = Math.round(
      (scores.skillMatch * 0.5) + 
      (scores.experienceMatch * 0.3) + 
      (scores.cultureMatch * 0.2)
    );
    
    return scores;
  }
}

module.exports = JobDescriptionAnalyzer;
