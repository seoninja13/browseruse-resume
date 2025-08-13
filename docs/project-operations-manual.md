# Project Operations Manual

> **📍 For complete project documentation, see [README-index.md](../README-index.md) - the central documentation hub.**

## Overview
This manual provides comprehensive guidance for day-to-day operations of the LinkedIn Browser Automation - Resume Submission System. It covers system startup, monitoring, troubleshooting, and maintenance procedures.

## Quick Start Guide

### System Requirements
- **Node.js**: Version 16.0.0 or higher
- **browsermcp MCP Server**: Installed and configured
- **Chrome Browser**: With browsermcp extension activated
- **LinkedIn Account**: Active account with #OPEN_TO_WORK status

### Initial Setup
1. **Clone Repository**
   ```bash
   git clone https://github.com/seoninja13/browseruse-resume.git
   cd browseruse-resume
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure System**
   - Review configuration files in `config/` directory
   - Update `profile-config.json` with current information
   - Verify `browsermcp-config.json` settings

4. **Activate browsermcp Extension**
   - Ensure Chrome extension is active
   - Verify connection to MCP server
   - Test LinkedIn session authentication

### Daily Operations

#### Starting the System
```bash
# Run full automation workflow
npm start

# Run with specific search filter
node index.js --filter=seo

# Run in test mode (no actual applications)
node index.js --test-mode
```

#### Monitoring System Status
- **Log Files**: Check `logs/` directory for automation logs
- **Application Status**: Review `logs/applications/` for submission records
- **Error Tracking**: Monitor `logs/errors/` for failed operations

#### System Health Checks
1. **browsermcp Connection**: Verify MCP server connectivity
2. **LinkedIn Session**: Confirm active authentication
3. **Daily Limits**: Check application submission counts
4. **Rate Limiting**: Monitor request frequency compliance

## Configuration Management

### Profile Configuration (`config/profile-config.json`)
**Update Frequency**: Monthly or when job search focus changes

Key settings to review:
- **Skills**: Keep current with latest technologies
- **Salary Preferences**: Adjust based on market conditions
- **Location Preferences**: Update if relocation plans change
- **Work Authorization**: Verify current status

### Search Filters (`config/search-filters.json`)
**Update Frequency**: Weekly based on job market analysis

Available filter presets:
- `seo`: SEO specialist positions
- `fullstack`: Full-stack development roles
- `ai`: AI/ML engineering positions
- `hybrid`: Multi-discipline technical roles

### LinkedIn Configuration (`config/linkedin-config.json`)
**Update Frequency**: As needed when LinkedIn UI changes

Critical settings:
- **Selectors**: CSS selectors for page elements
- **Delays**: Timing for automation actions
- **Limits**: Daily application and rate limits

## Automation Workflow

### Phase 1: System Initialization
1. **Module Loading**: Initialize job search and application modules
2. **Configuration Validation**: Verify all settings are current
3. **browsermcp Connection**: Establish MCP server connection
4. **LinkedIn Authentication**: Validate active session

### Phase 2: Job Search and Analysis
1. **Search Execution**: Run automated job search with filters
2. **Result Collection**: Gather job postings and details
3. **Match Analysis**: Score jobs based on profile criteria
4. **Ranking**: Sort opportunities by match score

### Phase 3: Application Submission
1. **Selection**: Choose top-ranked positions for application
2. **Template Selection**: Pick appropriate resume and cover letter
3. **Form Automation**: Fill application forms automatically
4. **Submission**: Submit applications with verification

### Phase 4: Tracking and Reporting
1. **Application Recording**: Log all submission attempts
2. **Status Monitoring**: Track application responses
3. **Performance Analysis**: Review success rates and metrics
4. **Report Generation**: Create summary reports

## Troubleshooting Guide

### Common Issues

#### browsermcp Connection Failed
**Symptoms**: "Error fetching configuration for server browsermcp"
**Solutions**:
1. Verify Chrome extension is active
2. Restart browsermcp MCP server
3. Check browser permissions
4. Refresh LinkedIn session

#### LinkedIn Session Expired
**Symptoms**: Redirected to login page during automation
**Solutions**:
1. Manually log into LinkedIn in Chrome
2. Verify session persistence settings
3. Check cookie and session storage
4. Restart automation system

#### Rate Limiting Detected
**Symptoms**: Automation slows down or fails
**Solutions**:
1. Reduce application frequency
2. Increase delays between actions
3. Check daily application limits
4. Review LinkedIn usage policies

#### Application Submission Failed
**Symptoms**: Easy Apply process fails or times out
**Solutions**:
1. Verify job still has Easy Apply option
2. Check form field selectors
3. Review application requirements
4. Manual verification of submission

### Error Recovery

#### Automatic Recovery
- **Retry Logic**: 3 attempts with exponential backoff
- **Session Recovery**: Automatic session restoration
- **Error Logging**: Detailed error tracking and analysis
- **Graceful Degradation**: Continue with available functions

#### Manual Recovery
1. **Check Logs**: Review error logs for specific issues
2. **Restart Components**: Restart failed modules individually
3. **Configuration Review**: Verify settings are correct
4. **Manual Testing**: Test individual functions manually

## Maintenance Procedures

### Daily Maintenance
- [ ] Review automation logs for errors
- [ ] Check application submission counts
- [ ] Monitor system performance metrics
- [ ] Verify LinkedIn session status

### Weekly Maintenance
- [ ] Update search filters based on job market
- [ ] Review and optimize resume templates
- [ ] Analyze application success rates
- [ ] Clean old log files and session data

### Monthly Maintenance
- [ ] Update profile configuration
- [ ] Review and update skill keywords
- [ ] Optimize automation timing and delays
- [ ] Update documentation and procedures

### Quarterly Maintenance
- [ ] Full system performance review
- [ ] Update browsermcp and dependencies
- [ ] Review LinkedIn policy compliance
- [ ] Backup configuration and templates

## Performance Monitoring

### Key Metrics
- **Search Success Rate**: Percentage of successful job searches
- **Application Success Rate**: Percentage of successful submissions
- **Match Score Average**: Average job matching accuracy
- **Daily Application Count**: Number of applications per day
- **Error Frequency**: Rate of automation errors

### Monitoring Tools
- **Log Analysis**: Automated log parsing and analysis
- **Performance Dashboard**: Real-time system status
- **Alert System**: Notifications for critical issues
- **Reporting**: Weekly and monthly performance reports

## Security and Compliance

### Data Protection
- **Personal Information**: Secure storage of profile data
- **Session Data**: Encrypted session information
- **Application Records**: Protected application history
- **Backup Security**: Secure backup procedures

### LinkedIn Compliance
- **Rate Limiting**: Respect LinkedIn usage limits
- **Terms of Service**: Comply with LinkedIn policies
- **Automation Guidelines**: Follow automation best practices
- **Account Safety**: Protect LinkedIn account integrity

## Support and Resources

### Internal Resources
- **Linear Project**: [1BU-361](https://linear.app/1builder/issue/1BU-361) - Master tracking issue
- **Repository**: https://github.com/seoninja13/browseruse-resume.git
- **Documentation**: Complete docs in `docs/` directory

### External Resources
- **LinkedIn Help**: LinkedIn automation policies and guidelines
- **browsermcp Documentation**: MCP server setup and configuration
- **Node.js Resources**: JavaScript and Node.js development guides

### Contact Information
- **Developer**: Ivo Dachev <dachevivo@gmail.com>
- **LinkedIn**: https://www.linkedin.com/in/ivo-dachev
- **Team**: 1builder (Linear workspace)

---

*This operations manual ensures smooth daily operation and maintenance of the LinkedIn Browser Automation system.*
