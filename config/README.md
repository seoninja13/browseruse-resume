# Configuration Directory

> **📍 For complete project documentation, see [README-index.md](../README-index.md) - the central documentation hub.**

## Overview
This directory contains all configuration files for the LinkedIn Browser Automation system. All settings are centralized here and loaded by the configuration manager.

## Configuration Files

### Core Configuration Files
- **`browsermcp-config.json`** - browsermcp MCP server settings and browser options
- **`linkedin-config.json`** - LinkedIn automation settings, selectors, and limits
- **`profile-config.json`** - Ivo Dachev's profile information and preferences
- **`search-filters.json`** - Predefined job search filter combinations

## Configuration Structure

### browsermcp Configuration
Controls browser automation behavior:
- Connection settings and timeouts
- Browser viewport and user agent
- Session persistence options
- Error handling preferences

### LinkedIn Configuration
Manages LinkedIn-specific automation:
- URL endpoints and navigation paths
- CSS selectors for page elements
- Timing delays for different operations
- Rate limiting and safety constraints

### Profile Configuration
Stores user profile information:
- Personal details (name, location, experience)
- Skills and qualifications
- Job preferences (salary, remote work, etc.)
- Contact information

### Search Filters
Predefined search combinations:
- SEO-focused positions
- Full-stack development roles
- AI/ML engineering positions
- Custom filter combinations

## Usage

Configuration files are automatically loaded by the `ConfigManager` class in `src/config.js`. The system uses a fallback approach:

1. **Load from file** - If configuration file exists, load settings
2. **Use defaults** - If file missing, use built-in defaults
3. **Environment override** - Environment variables can override any setting

## Environment Variables

Key environment variables that can override configuration:

```bash
# LinkedIn credentials (optional)
LINKEDIN_EMAIL=your-email@example.com

# Browser settings
BROWSERMCP_HEADLESS=false

# Automation limits
MAX_APPLICATIONS_PER_DAY=50

# Logging
LOG_LEVEL=info
```

## Security Notes

- **Never commit credentials** to version control
- Use environment variables for sensitive data
- Configuration files should contain only non-sensitive settings
- Personal information is stored in profile-config.json (excluded from git)

## File Management

- Configuration files are JSON format for easy editing
- Comments are not supported in JSON - use this README for documentation
- Backup important configurations before making changes
- Test configuration changes in development environment first

## Default Behavior

If configuration files are missing, the system will:
1. Log a warning about missing configuration
2. Use built-in default values
3. Continue operation with safe defaults
4. Create example configuration files on first run

## Related Documentation

- **[Architecture Documentation](../docs/architecture/architecture-documentation.md)** - System design details
- **[browsermcp Protocol](../docs/protocols/browsermcp-server-protocol.md)** - MCP server integration
- **[Project Operations Manual](../docs/project-operations-manual.md)** - Day-to-day operations

---

*This configuration system provides flexible, secure, and maintainable settings management for the LinkedIn Browser Automation project.*
