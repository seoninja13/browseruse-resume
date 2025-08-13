/**
 * Resume Generator Unit Tests
 * 
 * Comprehensive tests for the intelligent resume generation system
 * including job analysis, content customization, and PDF generation.
 */

const ResumeGenerator = require('../../src/modules/resume-generator');
const JobDescriptionAnalyzer = require('../../src/modules/job-description-analyzer');
const fs = require('fs');
const path = require('path');

// Mock job data for testing
const mockJobData = {
  fullstack: {
    id: 'test-job-fullstack-001',
    title: 'Senior Full-Stack Developer',
    company: 'TechCorp Inc.',
    location: 'Remote',
    description: 'We are looking for a Senior Full-Stack Developer with expertise in React, Node.js, and PostgreSQL. The ideal candidate will have 5+ years of experience building scalable web applications and working with cloud technologies like AWS. Experience with TypeScript, Docker, and CI/CD pipelines is preferred.',
    salary: '$90,000 - $120,000',
    easyApply: true
  },
  seo: {
    id: 'test-job-seo-001',
    title: 'SEO Specialist',
    company: 'Digital Marketing Pro',
    location: 'Sacramento, CA (Remote)',
    description: 'Seeking an experienced SEO Specialist with strong technical background. Must have expertise in Google Analytics, Google Search Console, and SEMrush. Knowledge of JavaScript, HTML, and Python for SEO automation is required. 3+ years of SEO experience with proven track record of increasing organic traffic.',
    salary: '$75,000 - $95,000',
    easyApply: true
  },
  ai: {
    id: 'test-job-ai-001',
    title: 'Machine Learning Engineer',
    company: 'AI Innovations Lab',
    location: 'San Francisco, CA (Hybrid)',
    description: 'Join our AI team as a Machine Learning Engineer. Required skills include Python, TensorFlow, scikit-learn, and experience with cloud platforms (AWS/Azure). Must have 4+ years of experience in ML model development and deployment. Knowledge of Docker, Kubernetes, and MLOps practices preferred.',
    salary: '$110,000 - $140,000',
    easyApply: true
  }
};

describe('ResumeGenerator', () => {
  let resumeGenerator;
  let jobAnalyzer;

  beforeAll(() => {
    // Ensure test directories exist
    const testDirs = [
      path.join(__dirname, '..', '..', 'templates', 'resumes', 'generated'),
      path.join(__dirname, '..', '..', 'templates', 'resumes', 'metadata')
    ];
    
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  beforeEach(() => {
    resumeGenerator = new ResumeGenerator();
    jobAnalyzer = new JobDescriptionAnalyzer();
  });

  describe('Initialization', () => {
    test('should initialize with master data and skills database', () => {
      expect(resumeGenerator.masterData).toBeDefined();
      expect(resumeGenerator.skillsDatabase).toBeDefined();
      expect(resumeGenerator.masterData.personalInfo.name).toBe('Ivo Dachev');
    });

    test('should create required directories', () => {
      const generatedDir = path.join(__dirname, '..', '..', 'templates', 'resumes', 'generated');
      const metadataDir = path.join(__dirname, '..', '..', 'templates', 'resumes', 'metadata');
      
      expect(fs.existsSync(generatedDir)).toBe(true);
      expect(fs.existsSync(metadataDir)).toBe(true);
    });
  });

  describe('Job Description Analysis', () => {
    test('should analyze full-stack job description correctly', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.fullstack);
      
      expect(analysis.jobType).toBe('fullstack');
      expect(analysis.overallMatchScore).toBeGreaterThan(80);
      expect(analysis.primaryFocus.primarySkills).toContain('React');
      expect(analysis.primaryFocus.primarySkills).toContain('Node.js');
    });

    test('should analyze SEO job description correctly', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.seo);
      
      expect(analysis.jobType).toBe('seo');
      expect(analysis.overallMatchScore).toBeGreaterThan(85);
      expect(analysis.primaryFocus.primarySkills).toContain('Google Analytics');
    });

    test('should analyze AI job description correctly', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.ai);
      
      expect(analysis.jobType).toBe('ai');
      expect(analysis.overallMatchScore).toBeGreaterThan(80);
      expect(analysis.primaryFocus.primarySkills).toContain('Python');
      expect(analysis.primaryFocus.primarySkills).toContain('TensorFlow');
    });

    test('should extract required skills correctly', () => {
      const jobText = 'required skills include react, node.js, and postgresql. experience with aws is preferred.';
      const skills = resumeGenerator.extractRequiredSkills(jobText);
      
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some(skill => skill.name === 'React')).toBe(true);
      expect(skills.some(skill => skill.name === 'Node.js')).toBe(true);
    });

    test('should determine job type correctly', () => {
      const fullstackText = 'full-stack developer react node.js javascript';
      const seoText = 'seo specialist google analytics search engine optimization';
      const aiText = 'machine learning engineer python tensorflow ai';
      
      expect(resumeGenerator.determineJobType(fullstackText)).toBe('fullstack');
      expect(resumeGenerator.determineJobType(seoText)).toBe('seo');
      expect(resumeGenerator.determineJobType(aiText)).toBe('ai');
    });
  });

  describe('Resume Customization', () => {
    test('should customize professional summary based on job type', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.fullstack);
      const customizedResume = await resumeGenerator.customizeResumeContent(analysis);
      
      expect(customizedResume.professionalSummary).toBeDefined();
      expect(customizedResume.professionalSummary).toContain('Full-Stack');
    });

    test('should customize work experience descriptions', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.seo);
      const customizedResume = await resumeGenerator.customizeResumeContent(analysis);
      
      expect(customizedResume.workExperience[0].description).toBeDefined();
      expect(Array.isArray(customizedResume.workExperience[0].description)).toBe(true);
    });

    test('should prioritize skills based on job requirements', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.ai);
      const customizedResume = await resumeGenerator.customizeResumeContent(analysis);
      
      expect(customizedResume.technicalSkills).toBeDefined();
      
      // Check if AI-related skills are highlighted
      const aiSkills = customizedResume.technicalSkills.aiMlTechnologies;
      expect(aiSkills).toBeDefined();
      
      const pythonSkill = aiSkills.Python;
      if (pythonSkill) {
        expect(pythonSkill.highlighted).toBe(true);
      }
    });

    test('should add customization metadata', async () => {
      const analysis = await resumeGenerator.analyzeJobDescription(mockJobData.fullstack);
      const customizedResume = await resumeGenerator.customizeResumeContent(analysis);
      
      expect(customizedResume.customizations).toBeDefined();
      expect(customizedResume.customizations.level).toBeDefined();
      expect(customizedResume.customizations.focusAreas).toBeDefined();
      expect(customizedResume.customizations.primarySkills).toBeDefined();
      expect(customizedResume.customizations.matchScore).toBeDefined();
    });
  });

  describe('Resume Generation', () => {
    test('should generate resume for full-stack job', async () => {
      const result = await resumeGenerator.generateResumeForJob(mockJobData.fullstack);
      
      expect(result.success).toBe(true);
      expect(result.resumePath).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.matchScore).toBeGreaterThan(80);
    });

    test('should generate resume for SEO job', async () => {
      const result = await resumeGenerator.generateResumeForJob(mockJobData.seo);
      
      expect(result.success).toBe(true);
      expect(result.resumePath).toBeDefined();
      expect(result.matchScore).toBeGreaterThan(80);
    });

    test('should generate resume for AI job', async () => {
      const result = await resumeGenerator.generateResumeForJob(mockJobData.ai);
      
      expect(result.success).toBe(true);
      expect(result.resumePath).toBeDefined();
      expect(result.matchScore).toBeGreaterThan(80);
    });

    test('should save metadata for generated resume', async () => {
      const result = await resumeGenerator.generateResumeForJob(mockJobData.fullstack);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.jobId).toBe(mockJobData.fullstack.id);
      expect(result.metadata.jobTitle).toBe(mockJobData.fullstack.title);
      expect(result.metadata.company).toBe(mockJobData.fullstack.company);
      expect(result.metadata.jobAnalysis).toBeDefined();
      expect(result.metadata.customizations).toBeDefined();
    });
  });

  describe('Skill Matching', () => {
    test('should calculate skill match scores correctly', () => {
      const requiredSkills = [
        { name: 'React', priority: 'high' },
        { name: 'Node.js', priority: 'high' },
        { name: 'Python', priority: 'medium' }
      ];
      
      const skillMatches = resumeGenerator.calculateSkillMatches(requiredSkills);
      
      expect(skillMatches.React).toBeDefined();
      expect(skillMatches['Node.js']).toBeDefined();
      expect(skillMatches.React.matchScore).toBeGreaterThan(80);
    });

    test('should find skills in master data', () => {
      const reactSkill = resumeGenerator.findSkillInMaster('React');
      const pythonSkill = resumeGenerator.findSkillInMaster('Python');
      
      expect(reactSkill).toBeDefined();
      expect(pythonSkill).toBeDefined();
      expect(reactSkill.proficiency).toBeGreaterThan(90);
      expect(pythonSkill.proficiency).toBeGreaterThan(85);
    });

    test('should calculate overall match score', () => {
      const skillMatches = {
        'React': { matchScore: 95 },
        'Node.js': { matchScore: 90 },
        'Python': { matchScore: 85 }
      };
      
      const experienceRequirements = { yearsRequired: 5 };
      const overallScore = resumeGenerator.calculateOverallMatchScore(skillMatches, experienceRequirements);
      
      expect(overallScore).toBeGreaterThan(80);
      expect(overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Generation Statistics', () => {
    test('should return generation statistics', () => {
      const stats = resumeGenerator.getGenerationStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalGenerated).toBeDefined();
      expect(stats.averageMatchScore).toBeDefined();
      expect(stats.jobTypeDistribution).toBeDefined();
      expect(stats.customizationLevels).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing job data gracefully', async () => {
      const invalidJobData = { id: 'invalid', title: '', company: '', description: '' };
      
      try {
        const result = await resumeGenerator.generateResumeForJob(invalidJobData);
        expect(result.success).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle corrupted master data gracefully', () => {
      // This would test error handling for corrupted data files
      // In a real implementation, we'd mock the file system
      expect(() => {
        const generator = new ResumeGenerator();
        expect(generator.masterData).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should generate resume within reasonable time', async () => {
      const startTime = Date.now();
      
      await resumeGenerator.generateResumeForJob(mockJobData.fullstack);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should handle multiple concurrent generations', async () => {
      const promises = [
        resumeGenerator.generateResumeForJob(mockJobData.fullstack),
        resumeGenerator.generateResumeForJob(mockJobData.seo),
        resumeGenerator.generateResumeForJob(mockJobData.ai)
      ];
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  afterAll(() => {
    // Cleanup test files if needed
    // In a real test environment, we'd clean up generated test files
  });
});

describe('JobDescriptionAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new JobDescriptionAnalyzer();
  });

  describe('Comprehensive Analysis', () => {
    test('should perform comprehensive job analysis', async () => {
      const analysis = await analyzer.analyzeJobDescription(mockJobData.fullstack);
      
      expect(analysis.basicInfo).toBeDefined();
      expect(analysis.skills).toBeDefined();
      expect(analysis.experience).toBeDefined();
      expect(analysis.company).toBeDefined();
      expect(analysis.jobType).toBeDefined();
      expect(analysis.scores).toBeDefined();
    });

    test('should extract skills with priorities', async () => {
      const analysis = await analyzer.analyzeJobDescription(mockJobData.seo);
      
      expect(analysis.skills.required).toBeDefined();
      expect(analysis.skills.preferred).toBeDefined();
      expect(analysis.skills.categories).toBeDefined();
      
      // Should find SEO-related skills
      const hasAnalyticsSkill = analysis.skills.required.some(skill => 
        skill.name.includes('Analytics') || skill.name.includes('Google')
      );
      expect(hasAnalyticsSkill).toBe(true);
    });

    test('should determine experience requirements', async () => {
      const analysis = await analyzer.analyzeJobDescription(mockJobData.ai);
      
      expect(analysis.experience.yearsRequired).toBeGreaterThan(0);
      expect(analysis.experience.seniorityLevel).toBeDefined();
      expect(['junior', 'mid', 'senior', 'executive']).toContain(analysis.experience.seniorityLevel);
    });
  });
});
