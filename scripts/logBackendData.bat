@echo off
REM ============================================
REM GNSS Backend Logger - Windows Launcher
REM ============================================
REM Usage: logBackendData.bat
REM Or double-click this file to run

echo.
echo ================================================
echo ^(  GNSS Backend Logger
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules\ws" (
    echo Installing dependencies...
    call npm install ws node-fetch
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Run the logging script
echo Starting backend logger...
echo.
node "%~dp0logBackendData.js"

if errorlevel 1 (
    echo.
    echo Error: Logger exited with error code %errorlevel%
    pause
) else (
    echo.
    echo Completed successfully!
)

pause
