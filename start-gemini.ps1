# LinkedIn Browser Automation - Gemini CLI Launcher (PowerShell)
# This script sets up the environment and starts Gemini CLI with the 1M token context window

Write-Host "Starting Gemini CLI for LinkedIn Browser Automation Project..." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# Set the API key environment variable
$env:GEMINI_API_KEY = "AIzaSyAYlOfIddQP4QwKbzP9yH3wQ-nUtqIp_Go"

# Display project information
Write-Host "Project: LinkedIn Browser Automation - Resume Submission System" -ForegroundColor Cyan
Write-Host "Repository: https://github.com/seoninja13/browseruse-resume.git" -ForegroundColor Cyan
Write-Host "Model: gemini-2.5-pro (1M token context window)" -ForegroundColor Cyan
Write-Host "Features: Intelligent Resume Generation, Job Analysis, Easy Apply Automation" -ForegroundColor Cyan
Write-Host ""

# Display usage tips
Write-Host "Usage Tips:" -ForegroundColor Yellow
Write-Host "- Reference files with @path/to/file (e.g., @README-index.md)" -ForegroundColor White
Write-Host "- Ask about project architecture, code analysis, or improvements" -ForegroundColor White
Write-Host "- Use the full 1M token context for comprehensive analysis" -ForegroundColor White
Write-Host "- Type /help for more commands" -ForegroundColor White
Write-Host ""

# Start Gemini CLI
Write-Host "Launching Gemini CLI..." -ForegroundColor Green
try {
    npx @google/gemini-cli
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
