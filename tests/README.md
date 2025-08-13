# Tests Directory

> **📍 For complete project documentation, see [README-index.md](../README-index.md) - the central documentation hub.**

## Overview
This directory contains comprehensive testing suites for the LinkedIn Browser Automation system. Tests are organized by type and scope to ensure system reliability and accuracy.

## Directory Structure

```
tests/
├── README.md                    # This file
├── unit/                        # Unit tests for individual modules
│   ├── config.test.js              # Configuration management tests
│   ├── job-search.test.js          # Job search module tests
│   ├── application-submission.test.js # Application submission tests
│   ├── browser-automation.test.js   # Browser automation tests
│   └── error-handling.test.js      # Error handling tests
├── integration/                 # Integration tests
│   ├── linkedin-integration.test.js # LinkedIn platform integration
│   ├── browsermcp-integration.test.js # browsermcp MCP server integration
│   ├── end-to-end-workflow.test.js  # Complete workflow testing
│   └── session-management.test.js   # Session persistence testing
├── automation/                  # Browser automation validation tests
│   ├── navigation.test.js          # Page navigation tests
│   ├── form-filling.test.js        # Form interaction tests
│   ├── element-detection.test.js   # Element selector validation
│   └── screenshot-validation.test.js # Visual validation tests
└── fixtures/                    # Test data and mock objects
    ├── mock-job-data.json          # Sample job posting data
    ├── mock-search-results.json    # Sample search results
    ├── mock-linkedin-pages.html    # Mock LinkedIn page structures
    └── test-configurations.json    # Test configuration sets
```

## Testing Framework

### Test Runner
**Framework**: Jest (JavaScript testing framework)
**Configuration**: `jest.config.js` in project root
**Coverage**: Minimum 80% code coverage required

### Test Categories

#### Unit Tests (`unit/`)
**Purpose**: Test individual modules and functions in isolation
**Scope**: Single module or function
**Mocking**: Heavy use of mocks for external dependencies
**Speed**: Fast execution (< 1 second per test)

#### Integration Tests (`integration/`)
**Purpose**: Test interaction between modules and external services
**Scope**: Multiple modules working together
**Mocking**: Limited mocking, real service integration where safe
**Speed**: Medium execution (1-10 seconds per test)

#### Automation Tests (`automation/`)
**Purpose**: Validate browser automation functionality
**Scope**: Browser interactions and LinkedIn integration
**Mocking**: Minimal mocking, real browser testing
**Speed**: Slower execution (10-60 seconds per test)

## Test Execution

### Running Tests

#### All Tests
```bash
# Run complete test suite
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (development)
npm run test:watch
```

#### Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Automation tests only
npm run test:automation

# Specific test file
npm test -- job-search.test.js
```

#### Test Environment Setup
```bash
# Setup test environment
npm run test:setup

# Clean test environment
npm run test:clean

# Reset test data
npm run test:reset
```

### Test Configuration

#### Environment Variables
```bash
# Test mode (prevents actual LinkedIn interactions)
TEST_MODE=true

# Mock browsermcp server
MOCK_BROWSERMCP=true

# Test LinkedIn account (if needed)
TEST_LINKEDIN_EMAIL=test@example.com

# Verbose logging for debugging
TEST_VERBOSE=true
```

#### Test Data Management
- **Mock Data**: Realistic but fake job postings and search results
- **Test Accounts**: Dedicated test LinkedIn accounts (if available)
- **Isolated Environment**: Tests run in isolated environment
- **Data Cleanup**: Automatic cleanup after test execution

## Unit Test Examples

### Configuration Tests (`unit/config.test.js`)
```javascript
describe('Configuration Manager', () => {
  test('should load default configuration', () => {
    const config = require('../src/config');
    expect(config.get('profile')).toBeDefined();
    expect(config.get('profile').name).toBe('Ivo Dachev');
  });

  test('should override with environment variables', () => {
    process.env.MAX_APPLICATIONS_PER_DAY = '25';
    const config = require('../src/config');
    expect(config.get('linkedin').limits.maxApplicationsPerDay).toBe(25);
  });
});
```

### Job Search Tests (`unit/job-search.test.js`)
```javascript
describe('Job Search Module', () => {
  test('should calculate job match scores correctly', () => {
    const jobSearch = new JobSearch();
    const mockJob = {
      title: 'Senior Full-Stack Developer',
      location: 'Remote',
      salary: '$90,000 - $120,000',
      easyApply: true
    };
    
    const match = jobSearch.calculateJobMatch(mockJob);
    expect(match.matchScore).toBeGreaterThan(80);
    expect(match.recommendation).toContain('Good Match');
  });
});
```

## Integration Test Examples

### LinkedIn Integration (`integration/linkedin-integration.test.js`)
```javascript
describe('LinkedIn Integration', () => {
  test('should authenticate with LinkedIn successfully', async () => {
    const browser = new BrowserAutomation();
    await browser.initialize();
    
    const result = await browser.validateLinkedInSession();
    expect(result.success).toBe(true);
    expect(result.sessionActive).toBe(true);
  });

  test('should perform job search without errors', async () => {
    const jobSearch = new JobSearch();
    await jobSearch.initialize();
    
    const results = await jobSearch.searchJobs({
      keywords: ['test developer'],
      location: 'Remote'
    });
    
    expect(results.success).toBe(true);
    expect(results.resultsCount).toBeGreaterThan(0);
  });
});
```

## Automation Test Examples

### Navigation Tests (`automation/navigation.test.js`)
```javascript
describe('Browser Navigation', () => {
  test('should navigate to LinkedIn Jobs page', async () => {
    const browser = new BrowserAutomation();
    await browser.initialize();
    
    const result = await browser.navigate('https://www.linkedin.com/jobs');
    expect(result.success).toBe(true);
    expect(result.url).toContain('linkedin.com/jobs');
  });

  test('should handle navigation errors gracefully', async () => {
    const browser = new BrowserAutomation();
    await browser.initialize();
    
    await expect(browser.navigate('invalid-url')).rejects.toThrow();
  });
});
```

## Test Data and Fixtures

### Mock Job Data (`fixtures/mock-job-data.json`)
```json
{
  "sampleJobs": [
    {
      "id": "test-job-1",
      "title": "Senior Full-Stack Developer",
      "company": "Test Company Inc.",
      "location": "Remote",
      "salary": "$90,000 - $120,000",
      "posted": "2 days ago",
      "easyApply": true,
      "description": "We are looking for a senior full-stack developer..."
    }
  ]
}
```

### Test Configurations (`fixtures/test-configurations.json`)
```json
{
  "testProfiles": {
    "defaultProfile": {
      "name": "Test User",
      "title": "Test Developer",
      "location": "Test City, CA",
      "skills": ["JavaScript", "React", "Node.js"]
    }
  },
  "testSearchFilters": {
    "basicSearch": {
      "keywords": ["developer"],
      "location": "Remote",
      "remote": true
    }
  }
}
```

## Test Quality Standards

### Code Coverage Requirements
- **Unit Tests**: Minimum 90% coverage
- **Integration Tests**: Minimum 70% coverage
- **Overall Coverage**: Minimum 80% coverage
- **Critical Paths**: 100% coverage for application submission

### Test Quality Metrics
- **Test Reliability**: Tests must pass consistently (>95% success rate)
- **Test Speed**: Unit tests < 1s, Integration tests < 10s
- **Test Maintainability**: Clear, readable, and well-documented tests
- **Test Independence**: Tests must not depend on each other

### Best Practices
- **Descriptive Names**: Test names clearly describe what is being tested
- **Single Responsibility**: Each test focuses on one specific behavior
- **Proper Mocking**: Mock external dependencies appropriately
- **Error Testing**: Test both success and failure scenarios
- **Data Cleanup**: Clean up test data after each test

## Continuous Integration

### Automated Testing
- **Pre-commit Hooks**: Run unit tests before commits
- **Pull Request Testing**: Full test suite on pull requests
- **Nightly Testing**: Complete automation tests nightly
- **Performance Testing**: Regular performance regression testing

### Test Reporting
- **Coverage Reports**: Detailed code coverage analysis
- **Test Results**: Comprehensive test execution reports
- **Performance Metrics**: Test execution time tracking
- **Failure Analysis**: Detailed failure investigation and reporting

## Debugging Tests

### Test Debugging Tools
```bash
# Run tests with debugging
npm run test:debug

# Run specific test with verbose output
npm test -- --verbose job-search.test.js

# Run tests with browser visible (automation tests)
npm run test:automation -- --headless=false
```

### Common Test Issues
- **Timing Issues**: Use proper waits and timeouts
- **Element Selection**: Verify CSS selectors are current
- **Session Management**: Ensure proper session cleanup
- **Rate Limiting**: Respect LinkedIn rate limits in tests

## Related Documentation

- **[Testing Strategy](../docs/testing/testing-strategy.md)** - Overall testing approach
- **[Project Operations Manual](../docs/project-operations-manual.md)** - Testing procedures
- **[Architecture Documentation](../docs/architecture/architecture-documentation.md)** - System design for testing

---

*This comprehensive testing framework ensures the reliability, accuracy, and maintainability of the LinkedIn Browser Automation system.*
