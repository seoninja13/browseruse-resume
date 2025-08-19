/**
 * Job Description Analysis Engine
 * Extracts key requirements, skills, and keywords from job postings
 * for intelligent resume customization
 */

class JobDescriptionAnalyzer {
    constructor() {
        this.skillKeywords = {
            technical: ['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'api', 'rest', 'graphql', 'git', 'ci/cd', 'devops', 'microservices', 'cloud', 'azure', 'gcp'],
            seo: ['seo', 'sem', 'google analytics', 'search engine optimization', 'keyword research', 'content optimization', 'link building', 'serp', 'organic traffic', 'google ads', 'ppc', 'conversion optimization', 'a/b testing', 'google search console', 'technical seo'],
            marketing: ['digital marketing', 'content marketing', 'social media', 'email marketing', 'marketing automation', 'lead generation', 'conversion rate', 'roi', 'kpi', 'campaign management', 'brand management', 'market research', 'customer acquisition'],
            leadership: ['team leadership', 'project management', 'strategic planning', 'budget management', 'stakeholder management', 'cross-functional', 'mentoring', 'coaching', 'performance management', 'agile', 'scrum', 'kanban'],
            analytics: ['data analysis', 'reporting', 'dashboard', 'metrics', 'kpi', 'excel', 'tableau', 'power bi', 'sql', 'python', 'r', 'statistics', 'data visualization', 'business intelligence']
        };
        
        this.industryKeywords = {
            technology: ['software', 'saas', 'tech', 'startup', 'fintech', 'edtech', 'healthtech', 'ai', 'machine learning', 'artificial intelligence'],
            marketing: ['agency', 'advertising', 'media', 'publishing', 'ecommerce', 'retail', 'consumer goods', 'brand'],
            finance: ['financial services', 'banking', 'investment', 'insurance', 'accounting', 'fintech'],
            healthcare: ['healthcare', 'medical', 'pharmaceutical', 'biotech', 'hospital', 'clinic'],
            consulting: ['consulting', 'advisory', 'professional services', 'strategy', 'management consulting']
        };
        
        this.experienceLevels = {
            entry: ['entry level', 'junior', 'associate', '0-2 years', 'new grad', 'recent graduate'],
            mid: ['mid level', 'experienced', '3-5 years', '2-5 years', 'senior associate'],
            senior: ['senior', 'lead', 'principal', '5+ years', '7+ years', 'expert', 'specialist'],
            executive: ['director', 'vp', 'vice president', 'head of', 'chief', 'executive', 'manager', '10+ years']
        };
    }

    /**
     * Analyze job description and extract key information
     * @param {string} jobDescription - Full job description text
     * @param {string} jobTitle - Job title
     * @param {string} company - Company name
     * @returns {Object} Analysis results
     */
    analyzeJobDescription(jobDescription, jobTitle, company) {
        const analysis = {
            jobTitle,
            company,
            extractedSkills: this.extractSkills(jobDescription),
            industryContext: this.identifyIndustry(jobDescription, company),
            experienceLevel: this.determineExperienceLevel(jobDescription, jobTitle),
            keyRequirements: this.extractKeyRequirements(jobDescription),
            preferredQualifications: this.extractPreferredQualifications(jobDescription),
            companyContext: this.analyzeCompanyContext(jobDescription, company),
            keywords: this.extractKeywords(jobDescription),
            analysisTimestamp: new Date().toISOString()
        };

        return analysis;
    }

    /**
     * Extract skills from job description
     */
    extractSkills(jobDescription) {
        const text = jobDescription.toLowerCase();
        const foundSkills = {
            technical: [],
            seo: [],
            marketing: [],
            leadership: [],
            analytics: []
        };

        // Check each skill category
        Object.keys(this.skillKeywords).forEach(category => {
            this.skillKeywords[category].forEach(skill => {
                if (text.includes(skill.toLowerCase())) {
                    foundSkills[category].push(skill);
                }
            });
        });

        return foundSkills;
    }

    /**
     * Identify industry context
     */
    identifyIndustry(jobDescription, company) {
        const text = (jobDescription + ' ' + company).toLowerCase();
        const industryScores = {};

        Object.keys(this.industryKeywords).forEach(industry => {
            let score = 0;
            this.industryKeywords[industry].forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    score++;
                }
            });
            industryScores[industry] = score;
        });

        // Return industry with highest score
        const topIndustry = Object.keys(industryScores).reduce((a, b) => 
            industryScores[a] > industryScores[b] ? a : b
        );

        return {
            primary: topIndustry,
            scores: industryScores,
            confidence: industryScores[topIndustry] > 0 ? industryScores[topIndustry] / 5 : 0
        };
    }

    /**
     * Determine experience level required
     */
    determineExperienceLevel(jobDescription, jobTitle) {
        const text = (jobDescription + ' ' + jobTitle).toLowerCase();
        
        for (const [level, keywords] of Object.entries(this.experienceLevels)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    return level;
                }
            }
        }

        // Default based on job title
        if (jobTitle.toLowerCase().includes('senior') || jobTitle.toLowerCase().includes('lead')) {
            return 'senior';
        } else if (jobTitle.toLowerCase().includes('director') || jobTitle.toLowerCase().includes('head')) {
            return 'executive';
        }

        return 'mid'; // Default assumption
    }

    /**
     * Extract key requirements
     */
    extractKeyRequirements(jobDescription) {
        const requirements = [];
        const lines = jobDescription.split('\n');
        
        let inRequirementsSection = false;
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            // Detect requirements section
            if (lowerLine.includes('requirements') || lowerLine.includes('qualifications') || 
                lowerLine.includes('must have') || lowerLine.includes('required')) {
                inRequirementsSection = true;
                continue;
            }
            
            // Stop at next section
            if (inRequirementsSection && (lowerLine.includes('preferred') || 
                lowerLine.includes('nice to have') || lowerLine.includes('benefits'))) {
                break;
            }
            
            // Extract bullet points or numbered items
            if (inRequirementsSection && (line.trim().startsWith('•') || 
                line.trim().startsWith('-') || line.trim().match(/^\d+\./))) {
                requirements.push(line.trim().replace(/^[•\-\d\.]\s*/, ''));
            }
        }

        return requirements.slice(0, 10); // Limit to top 10 requirements
    }

    /**
     * Extract preferred qualifications
     */
    extractPreferredQualifications(jobDescription) {
        const preferred = [];
        const lines = jobDescription.split('\n');
        
        let inPreferredSection = false;
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            // Detect preferred section
            if (lowerLine.includes('preferred') || lowerLine.includes('nice to have') || 
                lowerLine.includes('bonus') || lowerLine.includes('plus')) {
                inPreferredSection = true;
                continue;
            }
            
            // Stop at next section
            if (inPreferredSection && (lowerLine.includes('benefits') || 
                lowerLine.includes('what we offer') || lowerLine.includes('compensation'))) {
                break;
            }
            
            // Extract bullet points
            if (inPreferredSection && (line.trim().startsWith('•') || 
                line.trim().startsWith('-') || line.trim().match(/^\d+\./))) {
                preferred.push(line.trim().replace(/^[•\-\d\.]\s*/, ''));
            }
        }

        return preferred.slice(0, 5); // Limit to top 5 preferred
    }

    /**
     * Analyze company context
     */
    analyzeCompanyContext(jobDescription, company) {
        const text = jobDescription.toLowerCase();
        
        return {
            companyName: company,
            size: this.estimateCompanySize(text),
            culture: this.analyzeCulture(text),
            values: this.extractValues(text)
        };
    }

    /**
     * Estimate company size from description
     */
    estimateCompanySize(text) {
        if (text.includes('startup') || text.includes('small team')) return 'startup';
        if (text.includes('enterprise') || text.includes('fortune')) return 'enterprise';
        if (text.includes('mid-size') || text.includes('growing company')) return 'mid-size';
        return 'unknown';
    }

    /**
     * Analyze company culture
     */
    analyzeCulture(text) {
        const cultureKeywords = {
            innovative: ['innovative', 'cutting-edge', 'disruptive', 'pioneering'],
            collaborative: ['collaborative', 'team-oriented', 'cross-functional', 'partnership'],
            fastPaced: ['fast-paced', 'dynamic', 'agile', 'rapid growth'],
            datadriven: ['data-driven', 'analytical', 'metrics', 'evidence-based']
        };

        const foundCulture = [];
        Object.keys(cultureKeywords).forEach(trait => {
            if (cultureKeywords[trait].some(keyword => text.includes(keyword))) {
                foundCulture.push(trait);
            }
        });

        return foundCulture;
    }

    /**
     * Extract company values
     */
    extractValues(text) {
        const valueKeywords = ['integrity', 'innovation', 'excellence', 'customer-focused', 
                              'diversity', 'inclusion', 'sustainability', 'quality'];
        
        return valueKeywords.filter(value => text.includes(value));
    }

    /**
     * Extract all relevant keywords for matching
     */
    extractKeywords(jobDescription) {
        const text = jobDescription.toLowerCase();
        const keywords = new Set();

        // Add all found skills
        Object.values(this.skillKeywords).flat().forEach(skill => {
            if (text.includes(skill.toLowerCase())) {
                keywords.add(skill);
            }
        });

        // Add industry keywords
        Object.values(this.industryKeywords).flat().forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                keywords.add(keyword);
            }
        });

        return Array.from(keywords);
    }
}

module.exports = JobDescriptionAnalyzer;
