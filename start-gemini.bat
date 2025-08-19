@echo off
REM LinkedIn Browser Automation - Gemini CLI Launcher
REM This script sets up the environment and starts Gemini CLI with the 1M token context window

echo Starting Gemini CLI for LinkedIn Browser Automation Project...
echo ================================================================

REM Set the API key environment variable
set GEMINI_API_KEY=AIzaSyAYlOfIddQP4QwKbzP9yH3wQ-nUtqIp_Go

REM Display project information
echo Project: LinkedIn Browser Automation - Resume Submission System
echo Repository: https://github.com/seoninja13/browseruse-resume.git
echo Model: gemini-2.5-pro (1M token context window)
echo.

REM Start Gemini CLI
echo Launching Gemini CLI...
npx @google/gemini-cli

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Error occurred. Press any key to exit...
    pause >nul
)
