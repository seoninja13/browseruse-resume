/**
 * Resume-Job Matching Algorithm
 * Validates resume-job alignment and ensures 80-90% match threshold
 * Provides detailed scoring and improvement recommendations
 */

class ResumeJobMatcher {
    constructor() {
        this.matchThreshold = {
            minimum: 80,
            target: 90,
            excellent: 95
        };
        
        this.scoringWeights = {
            skillsMatch: 0.35,        // 35% - Most important
            experienceRelevance: 0.25, // 25% - Very important
            industryAlignment: 0.15,   // 15% - Important
            keywordDensity: 0.15,     // 15% - Important
            achievementsRelevance: 0.10 // 10% - Supporting
        };
    }

    /**
     * Calculate comprehensive match score between resume and job
     * @param {Object} resumeData - Generated resume content
     * @param {Object} jobAnalysis - Job description analysis
     * @returns {Object} Match score and detailed breakdown
     */
    calculateMatchScore(resumeData, jobAnalysis) {
        const startTime = Date.now();
        
        const scores = {
            skillsMatch: this.calculateSkillsMatch(resumeData, jobAnalysis),
            experienceRelevance: this.calculateExperienceRelevance(resumeData, jobAnalysis),
            industryAlignment: this.calculateIndustryAlignment(resumeData, jobAnalysis),
            keywordDensity: this.calculateKeywordDensity(resumeData, jobAnalysis),
            achievementsRelevance: this.calculateAchievementsRelevance(resumeData, jobAnalysis)
        };

        // Calculate weighted total score
        const totalScore = Object.keys(scores).reduce((total, category) => {
            return total + (scores[category] * this.scoringWeights[category]);
        }, 0);

        const calculationTime = (Date.now() - startTime) / 1000;

        return {
            totalScore: Math.round(totalScore * 100) / 100,
            breakdown: scores,
            meetsThreshold: totalScore >= this.matchThreshold.minimum,
            qualityLevel: this.getQualityLevel(totalScore),
            recommendations: this.generateRecommendations(scores, totalScore),
            calculationTime,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate skills matching score
     */
    calculateSkillsMatch(resumeData, jobAnalysis) {
        const resumeSkills = [
            ...(resumeData.skills?.primary || []),
            ...(resumeData.skills?.secondary || [])
        ].map(skill => skill.toLowerCase());

        const jobSkills = Object.values(jobAnalysis.extractedSkills)
            .flat()
            .map(skill => skill.toLowerCase());

        if (jobSkills.length === 0) return 0.5; // Default if no skills extracted

        // Calculate exact matches
        const exactMatches = jobSkills.filter(jobSkill => 
            resumeSkills.some(resumeSkill => 
                resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
            )
        ).length;

        // Calculate partial matches (similar skills)
        const partialMatches = jobSkills.filter(jobSkill => 
            resumeSkills.some(resumeSkill => 
                this.calculateStringSimilarity(resumeSkill, jobSkill) > 0.6
            )
        ).length;

        const matchScore = (exactMatches * 1.0 + partialMatches * 0.5) / jobSkills.length;
        return Math.min(matchScore, 1.0);
    }

    /**
     * Calculate experience relevance score
     */
    calculateExperienceRelevance(resumeData, jobAnalysis) {
        const experienceLevel = jobAnalysis.experienceLevel;
        const resumeExperience = resumeData.experience;

        // Map experience levels to years
        const experienceMapping = {
            entry: { min: 0, max: 2 },
            mid: { min: 2, max: 5 },
            senior: { min: 5, max: 10 },
            executive: { min: 10, max: 20 }
        };

        const requiredRange = experienceMapping[experienceLevel] || experienceMapping.mid;
        
        // Extract years from resume (simplified - would parse from actual content)
        const resumeYears = this.extractYearsFromExperience(resumeExperience);
        
        // Score based on how well experience aligns
        if (resumeYears >= requiredRange.min && resumeYears <= requiredRange.max * 1.5) {
            return 1.0; // Perfect match
        } else if (resumeYears >= requiredRange.min * 0.8) {
            return 0.8; // Good match
        } else if (resumeYears >= requiredRange.min * 0.5) {
            return 0.6; // Acceptable match
        } else {
            return 0.3; // Poor match
        }
    }

    /**
     * Calculate industry alignment score
     */
    calculateIndustryAlignment(resumeData, jobAnalysis) {
        const jobIndustry = jobAnalysis.industryContext.primary;
        const industryConfidence = jobAnalysis.industryContext.confidence;
        
        // Check if resume mentions industry-relevant terms
        const resumeText = JSON.stringify(resumeData).toLowerCase();
        const industryKeywords = this.getIndustryKeywords(jobIndustry);
        
        const mentionedKeywords = industryKeywords.filter(keyword => 
            resumeText.includes(keyword.toLowerCase())
        ).length;

        const alignmentScore = mentionedKeywords / industryKeywords.length;
        
        // Weight by industry detection confidence
        return alignmentScore * industryConfidence;
    }

    /**
     * Calculate keyword density score
     */
    calculateKeywordDensity(resumeData, jobAnalysis) {
        const resumeText = JSON.stringify(resumeData).toLowerCase();
        const jobKeywords = jobAnalysis.keywords.map(k => k.toLowerCase());
        
        if (jobKeywords.length === 0) return 0.5;

        const keywordMatches = jobKeywords.filter(keyword => 
            resumeText.includes(keyword)
        ).length;

        return keywordMatches / jobKeywords.length;
    }

    /**
     * Calculate achievements relevance score
     */
    calculateAchievementsRelevance(resumeData, jobAnalysis) {
        const achievements = resumeData.achievements || [];
        const jobRequirements = jobAnalysis.keyRequirements;
        
        if (achievements.length === 0 || jobRequirements.length === 0) return 0.5;

        let relevanceScore = 0;
        achievements.forEach(achievement => {
            const achievementText = achievement.toLowerCase();
            const relevantRequirements = jobRequirements.filter(req => 
                this.hasSemanticOverlap(achievementText, req.toLowerCase())
            ).length;
            
            relevanceScore += relevantRequirements / jobRequirements.length;
        });

        return Math.min(relevanceScore / achievements.length, 1.0);
    }

    /**
     * Get quality level based on total score
     */
    getQualityLevel(score) {
        if (score >= this.matchThreshold.excellent / 100) return 'excellent';
        if (score >= this.matchThreshold.target / 100) return 'good';
        if (score >= this.matchThreshold.minimum / 100) return 'acceptable';
        return 'needs_improvement';
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations(scores, totalScore) {
        const recommendations = [];
        
        if (totalScore < this.matchThreshold.minimum / 100) {
            recommendations.push('Overall match score below 80% threshold - significant improvements needed');
        }

        // Skills recommendations
        if (scores.skillsMatch < 0.7) {
            recommendations.push('Add more job-relevant skills to resume');
            recommendations.push('Emphasize technical skills mentioned in job description');
        }

        // Experience recommendations
        if (scores.experienceRelevance < 0.7) {
            recommendations.push('Better align experience section with job requirements');
            recommendations.push('Highlight relevant project experience');
        }

        // Industry recommendations
        if (scores.industryAlignment < 0.6) {
            recommendations.push('Include more industry-specific terminology');
            recommendations.push('Emphasize relevant industry experience');
        }

        // Keyword recommendations
        if (scores.keywordDensity < 0.6) {
            recommendations.push('Incorporate more keywords from job description');
            recommendations.push('Optimize resume for ATS keyword scanning');
        }

        // Achievements recommendations
        if (scores.achievementsRelevance < 0.6) {
            recommendations.push('Tailor achievements to match job requirements');
            recommendations.push('Quantify achievements with relevant metrics');
        }

        return recommendations;
    }

    /**
     * Validate resume meets threshold requirements
     */
    validateResumeThreshold(matchResult) {
        return {
            isValid: matchResult.meetsThreshold,
            score: matchResult.totalScore,
            threshold: this.matchThreshold.minimum,
            qualityLevel: matchResult.qualityLevel,
            canSubmit: matchResult.totalScore >= this.matchThreshold.minimum,
            needsImprovement: matchResult.totalScore < this.matchThreshold.target,
            recommendations: matchResult.recommendations
        };
    }

    // Helper methods
    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    extractYearsFromExperience(experience) {
        // Simplified extraction - would parse actual resume content
        if (experience && experience.duration) {
            const match = experience.duration.match(/(\d+)/);
            return match ? parseInt(match[1]) : 5;
        }
        return 5; // Default assumption
    }

    getIndustryKeywords(industry) {
        const keywords = {
            technology: ['software', 'development', 'engineering', 'technical', 'programming'],
            marketing: ['marketing', 'campaigns', 'digital', 'content', 'advertising'],
            finance: ['financial', 'investment', 'banking', 'analysis', 'accounting'],
            healthcare: ['healthcare', 'medical', 'patient', 'clinical', 'health']
        };
        
        return keywords[industry] || keywords.technology;
    }

    hasSemanticOverlap(text1, text2) {
        const words1 = text1.split(' ').filter(w => w.length > 3);
        const words2 = text2.split(' ').filter(w => w.length > 3);
        
        const overlap = words1.filter(word => 
            words2.some(w => w.includes(word) || word.includes(w))
        ).length;
        
        return overlap > 0;
    }
}

module.exports = ResumeJobMatcher;
