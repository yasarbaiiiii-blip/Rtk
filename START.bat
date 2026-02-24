@echo off
REM ============================================
REM GNSS Base Station Development Launcher
REM ============================================
REM Run this batch file to start both:
REM 1. Terminal Logger Server (logs UI actions)
REM 2. Dev Server (runs the app)

echo.
echo ================================================
echo   GNSS Base Station - Development Launcher
echo ================================================
echo.
echo Starting Terminal Logger Server...
echo   - Listening on http://localhost:3001
echo   - Displays all UI actions in real-time
echo.
echo Starting Dev Server...
echo   - App runs at http://localhost:5173
echo   - Press Ctrl+C to stop both
echo.
echo ================================================
echo.

REM Start terminal logger in one process and dev server in another
REM Both run simultaneously
start "Terminal Logger" npm run log:terminal
timeout /t 2
start "Dev Server" npm run dev

echo.
echo Both servers started! Open your browser to http://localhost:5173
echo Check the "Terminal Logger" window for live UI action logs.
echo.
