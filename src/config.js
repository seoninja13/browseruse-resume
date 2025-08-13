/**
 * Configuration Management for LinkedIn Browser Automation
 * 
 * Centralized configuration system for all automation components.
 * Loads settings from config files and environment variables.
 * 
 * @author Ivo Dachev <dachevivo@gmail.com>
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.configDir = path.join(__dirname, '..', 'config');
    this.config = this.loadConfiguration();
  }

  /**
   * Load all configuration files
   */
  loadConfiguration() {
    const config = {
      profile: this.loadProfileConfig(),
      linkedin: this.loadLinkedInConfig(),
      browsermcp: this.loadBrowserMCPConfig(),
      searchFilters: this.loadSearchFilters(),
      automation: this.getAutomationDefaults()
    };

    // Override with environment variables if present
    this.applyEnvironmentOverrides(config);
    
    return config;
  }

  /**
   * Load Ivo's profile configuration
   */
  loadProfileConfig() {
    const defaultProfile = {
      name: 'Ivo Dachev',
      title: 'Full-Stack Web/AI Developer',
      experience: '15+ years',
      location: 'Sacramento, California',
      skills: [
        'Full-Stack Development',
        'AI/ML Engineering',
        'SEO/SEM Optimization',
        'Web Technologies',
        'JavaScript/Node.js',
        'Python',
        'React/Vue.js',
        'Database Design',
        'Cloud Architecture'
      ],
      preferences: {
        remote: true,
        hybrid: true,
        onsite: false,
        salaryMin: 75000,
        salaryMax: 150000,
        experienceLevel: 'Senior'
      }
    };

    return this.loadConfigFile('profile-config.json', defaultProfile);
  }

  /**
   * Load LinkedIn automation settings
   */
  loadLinkedInConfig() {
    const defaultLinkedIn = {
      baseUrl: 'https://www.linkedin.com',
      jobsUrl: 'https://www.linkedin.com/jobs',
      searchUrl: 'https://www.linkedin.com/jobs/search',
      selectors: {
        jobsLink: '[data-test-id="jobs-tab"]',
        searchInput: 'input[aria-label*="Search by title"]',
        locationInput: 'input[aria-label*="City, state"]',
        searchButton: 'button[aria-label="Search"]',
        jobCard: '[data-job-id]',
        easyApplyButton: 'button[aria-label*="Easy Apply"]',
        submitButton: 'button[aria-label="Submit application"]'
      },
      delays: {
        navigation: 3000,
        search: 2000,
        pageLoad: 5000,
        formFill: 1000,
        submission: 3000
      },
      limits: {
        maxApplicationsPerDay: 50,
        maxSearchResults: 1000,
        retryAttempts: 3,
        sessionTimeout: 28800000 // 8 hours
      }
    };

    return this.loadConfigFile('linkedin-config.json', defaultLinkedIn);
  }

  /**
   * Load browsermcp server configuration
   */
  loadBrowserMCPConfig() {
    const defaultBrowserMCP = {
      serverName: 'browsermcp',
      connectionTimeout: 30000,
      sessionPersistence: true,
      headless: false,
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      options: {
        ignoreHTTPSErrors: true,
        slowMo: 100,
        devtools: false
      }
    };

    return this.loadConfigFile('browsermcp-config.json', defaultBrowserMCP);
  }

  /**
   * Load job search filter presets
   */
  loadSearchFilters() {
    const defaultFilters = {
      seo: {
        keywords: ['SEO', 'Search Engine Optimization', 'SEO Specialist', 'SEO Manager'],
        location: 'Sacramento, CA',
        remote: true,
        experienceLevel: 'Senior',
        jobType: 'Full-time'
      },
      fullstack: {
        keywords: ['Full-Stack Developer', 'Full Stack Engineer', 'Web Developer'],
        location: 'Sacramento, CA',
        remote: true,
        experienceLevel: 'Senior',
        jobType: 'Full-time'
      },
      ai: {
        keywords: ['AI Engineer', 'Machine Learning Engineer', 'AI Developer', 'ML Engineer'],
        location: 'Sacramento, CA',
        remote: true,
        experienceLevel: 'Senior',
        jobType: 'Full-time'
      }
    };

    return this.loadConfigFile('search-filters.json', defaultFilters);
  }

  /**
   * Get automation default settings
   */
  getAutomationDefaults() {
    return {
      enableLogging: true,
      logLevel: 'info',
      enableScreenshots: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 5000,
      enableRateLimit: true,
      rateLimitDelay: 2000,
      enableErrorRecovery: true,
      sessionBackup: true
    };
  }

  /**
   * Load configuration file with fallback to defaults
   */
  loadConfigFile(filename, defaultConfig) {
    const filePath = path.join(this.configDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const loadedConfig = JSON.parse(fileContent);
        return { ...defaultConfig, ...loadedConfig };
      }
    } catch (error) {
      console.warn(`Warning: Could not load ${filename}, using defaults:`, error.message);
    }
    
    return defaultConfig;
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides(config) {
    // LinkedIn credentials (if provided via environment)
    if (process.env.LINKEDIN_EMAIL) {
      config.linkedin.email = process.env.LINKEDIN_EMAIL;
    }
    
    // browsermcp settings
    if (process.env.BROWSERMCP_HEADLESS) {
      config.browsermcp.headless = process.env.BROWSERMCP_HEADLESS === 'true';
    }
    
    // Automation limits
    if (process.env.MAX_APPLICATIONS_PER_DAY) {
      config.linkedin.limits.maxApplicationsPerDay = parseInt(process.env.MAX_APPLICATIONS_PER_DAY);
    }
    
    // Logging level
    if (process.env.LOG_LEVEL) {
      config.automation.logLevel = process.env.LOG_LEVEL;
    }
  }

  /**
   * Get configuration section
   */
  get(section) {
    return this.config[section];
  }

  /**
   * Get full configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Update configuration section
   */
  update(section, updates) {
    if (this.config[section]) {
      this.config[section] = { ...this.config[section], ...updates };
    }
  }

  /**
   * Save configuration to file
   */
  saveConfig(section, filename) {
    const filePath = path.join(this.configDir, filename);
    const configData = JSON.stringify(this.config[section], null, 2);
    
    try {
      fs.writeFileSync(filePath, configData, 'utf8');
      console.log(`Configuration saved to ${filename}`);
    } catch (error) {
      console.error(`Error saving configuration to ${filename}:`, error.message);
    }
  }
}

// Export singleton instance
module.exports = new ConfigManager();
