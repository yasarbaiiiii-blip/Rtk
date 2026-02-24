# 🔧 Backend Logger Setup & Integration Guide

Complete step-by-step guide to set up and use the backend logging system.

---

## 📦 Prerequisites

- ✅ Node.js 16+ installed
- ✅ Backend server running at `http://192.168.1.33:8000`
- ✅ npm or yarn package manager

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Backend URL

First, make sure your backend is accessible:

```bash
# In your browser or terminal
curl http://192.168.1.33:8000/docs

# Expected response: Interactive API documentation page
```

If this fails, update the API_BASE in:
- `scripts/logBackendData.js` (line 15)
- `src/api/gnssApi.ts` (line 4)
- `src/utils/backendLogger.ts` (line 10)

### Step 2: Install Optional Dependencies

```bash
cd d:\Base
npm install ws node-fetch  # Needed for Node.js logging script
```

Or let the script auto-install on first run.

### Step 3: Run the Logger

**Choose your method:**

#### Option A: Windows Users
```bash
# Double-click this file:
scripts/logBackendData.bat

# Or from command line:
node scripts/logBackendData.js
```

#### Option B: Linux/Mac Users
```bash
chmod +x scripts/logBackendData.sh
./scripts/logBackendData.sh

# Or directly:
node scripts/logBackendData.js
```

#### Option C: Using npm script
```bash
# Add to package.json first (see Step 4)
npm run log:backend
```

---

## 📋 Step-by-Step Integration

### Step 1: Update package.json

Add these npm scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "log:backend": "node scripts/logBackendData.js",
    "log:backend:ts": "ts-node scripts/logBackendData.ts",
    "log:watch": "nodemon scripts/logBackendData.js"
  },
  "devDependencies": {
    "ws": "^8.14.0",
    "node-fetch": "^2.7.0",
    "nodemon": "^3.0.2"
  }
}
```

Then run:
```bash
npm install
```

### Step 2: Add Debug Panel to Your App

Open `src/app/App.tsx` and add:

```tsx
import { BackendLoggerDebugPanel } from './components/BackendLoggerDebugPanel';

export const App = () => {
  return (
    <>
      {/* Your existing app content */}
      <AppContent />
      
      {/* Add this line - only shows in development */}
      {import.meta.env.MODE === 'development' && (
        <BackendLoggerDebugPanel />
      )}
    </>
  );
};
```

### Step 3: Make Logger Globally Available (Optional)

In `src/main.tsx`:

```tsx
import { backendLogger } from './utils/backendLogger';

// Make available in browser console during development
if (import.meta.env.MODE === 'development') {
  (window as any).backendLogger = backendLogger;
  console.log('🔍 Backend Logger available as: window.backendLogger');
}
```

### Step 4: Connect WebSocket on App Load (Optional)

In `src/app/App.tsx`:

```tsx
import { useEffect } from 'react';
import { backendLogger } from '../utils/backendLogger';

export const App = () => {
  useEffect(() => {
    // Auto-connect to WebSocket for real-time monitoring
    if (import.meta.env.MODE === 'development') {
      backendLogger.connectWebSocket().catch(console.error);
    }

    return () => {
      backendLogger.disconnectWebSocket();
    };
  }, []);

  // ... rest of app
};
```

---

## 🎯 Usage Scenarios

### Scenario 1: Quick Backend Test

**Goal:** Verify all endpoints are working

```bash
npm run log:backend
```

This will:
1. ✅ Test 5 GET endpoints
2. ✅ Test 5 POST endpoints
3. ✅ Connect to WebSocket
4. ✅ Save logs to `logs/backend-log-*.json`
5. ✅ Print formatted output

**Expected output:**
```
================================================
🚀 GNSS Backend Logging Script Started
================================================
📍 Backend URL: http://192.168.1.33:8000
🔌 WebSocket URL: ws://192.168.1.33:8000/ws/status
📁 Log File: d:\Base\logs\backend-log-2025-02-16T14-30-45-123Z.json
================================================

📊 Testing GET Endpoints...

📡 Testing: Health Check
   📊 Status: 200
   ⏱️  Duration: 45.23ms

📡 Testing: GNSS Status
   📊 Status: 200
   ⏱️  Duration: 52.15ms

... (continues for all endpoints)

📊 Logging Summary
================================================
📝 Total Log Entries: 47
✅ Endpoints: 32
🔌 WebSocket Messages: 10
❌ Errors: 5
================================================

✅ Logs saved to: d:\Base\logs\backend-log-2025-02-16T14-30-45-123Z.json
```

### Scenario 2: Real-time Monitoring in Browser

**Goal:** Monitor API calls while using the app

1. Start your dev server: `npm run dev`
2. Click the 🔧 button in bottom-right corner
3. You'll see all API calls in real-time
4. Click "Test API" to trigger endpoint tests
5. Click on any log entry to see details
6. Use "Stats" tab to see response times

### Scenario 3: Continuous Backend Monitoring

**Goal:** Watch backend in real-time while developing

```bash
npm run log:watch
```

This uses `nodemon` to re-run the logger every 30 seconds automatically.

### Scenario 4: Export and Analyze Logs

**From Browser:**
```javascript
// In browser console
backendLogger.downloadLogs('json')  // Download as JSON
backendLogger.downloadLogs('csv')   // Download as CSV
```

**From Node Script:**
```bash
npm run log:backend
# Logs automatically saved to: logs/backend-log-*.json
# Open in text editor or Excel
```

---

## 📊 Understanding the Logs

### Log Entry Structure

Every log entry contains:
```json
{
  "timestamp": "2025-02-16T14:30:45.123Z",     // When it happened
  "type": "ENDPOINT",                           // Type of event
  "endpoint": "/api/v1/health",                 // Which endpoint
  "method": "GET",                              // HTTP method
  "status": 200,                                 // HTTP status code
  "duration": 45.23,                            // Response time in ms
  "data": { /* response data */ },              // Response body
  "error": null                                 // Error if any
}
```

### Interpreting Results

**Good Response:**
```json
{
  "status": 200,
  "duration": 50,        ← Good (< 200ms)
  "error": null
}
```

**Slow Response (Warning):**
```json
{
  "status": 200,
  "duration": 2000,      ← Slow (> 1 second)
  "error": null
}
```

**Failed Request (Error):**
```json
{
  "status": 0,
  "duration": 5000,
  "error": "Network timeout"
}
```

---

## 🔍 Debugging Tips

### Find All Errors in Logs

```bash
# On Linux/Mac
grep '"type": "API_ERROR"' logs/backend-log-*.json

# Or on Windows
findstr "API_ERROR" logs\backend-log-*.json
```

### Analyze Response Times

```javascript
// In browser console
const logs = backendLogger.getLogsByType('API_RESPONSE');
const times = logs.map(l => l.duration);
console.log('Min:', Math.min(...times), 'ms');
console.log('Max:', Math.max(...times), 'ms');
console.log('Avg:', times.reduce((a,b) => a+b)/times.length, 'ms');
```

### Test Specific Endpoint

```javascript
// In browser console
fetch('http://192.168.1.33:8000/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## ⚙️ Configuration

### Change Backend URL

**File: `src/api/gnssApi.ts`** (line 4)
```typescript
const API_BASE = "http://192.168.1.33:8000";  // ← Change this
```

**File: `scripts/logBackendData.js`** (line 15)
```javascript
const API_BASE = "http://192.168.1.33:8000";  // ← Change this
```

### Change Log History Limit

**File: `src/utils/backendLogger.ts`** (line 20)
```typescript
private maxLogs: number = 1000;  // ← Change this
```

If you want to keep fewer logs to save memory:
```typescript
private maxLogs: number = 100;   // Keep only last 100
```

### Disable Debug Panel in Production

**File: `src/app/App.tsx`**
```tsx
{import.meta.env.MODE === 'development' && (
  <BackendLoggerDebugPanel />  // ← Only shows in dev mode
)}
```

---

## 📁 File Locations

```
d:\Base/
├── scripts/
│   ├── logBackendData.js          ← Main Node.js script
│   ├── logBackendData.ts          ← TypeScript version
│   ├── logBackendData.bat         ← Windows launcher
│   ├── logBackendData.sh          ← Linux/Mac launcher
│   ├── LOGGING_GUIDE.md           ← Full documentation
│   └── SETUP.md                   ← This file
│
├── src/
│   ├── utils/
│   │   └── backendLogger.ts       ← Browser logger utility
│   │
│   └── app/
│       └── components/
│           └── BackendLoggerDebugPanel.tsx  ← React debug component
│
└── logs/
    └── backend-log-*.json         ← Generated log files
```

---

## 🆘 Troubleshooting

### Issue: "Cannot find module 'ws'"

**Solution:**
```bash
npm install ws
```

### Issue: "ECONNREFUSED" error

**Solution:**
1. Check backend is running: Open `http://192.168.1.33:8000/docs` in browser
2. Verify IP address is correct
3. Check network connectivity: `ping 192.168.1.33`

### Issue: Debug panel not appearing

**Solution:**
1. Verify you're in development mode: `npm run dev` (not production)
2. Check that BackendLoggerDebugPanel is imported in App.tsx
3. Open browser console (F12) and check for errors

### Issue: Logs not being captured

**Solution:**
1. Ensure all API calls use the `api` object from `src/api/gnssApi.ts`
2. Check browser console for fetch errors
3. Verify backend URL is accessible

---

## 📈 Performance Monitoring

Use the logger to identify performance bottlenecks:

```javascript
// Get all API responses sorted by duration
const logs = backendLogger.getLogsByType('API_RESPONSE')
  .sort((a, b) => (b.duration || 0) - (a.duration || 0));

logs.forEach(log => {
  console.log(`${log.endpoint}: ${log.duration}ms`);
});
```

**Target response times:**
- ✅ Good: < 100ms
- ⚠️ Warning: 100-500ms  
- ❌ Poor: > 500ms

---

## 🎓 Advanced Features

### Custom Log Filtering

```javascript
// Get logs from last 5 minutes
const now = Date.now();
const logs = backendLogger.getLogs()
  .filter(l => now - l.timestamp.getTime() < 5 * 60 * 1000);

// Get failed requests only
const errors = backendLogger.getLogsByType('API_ERROR');

// Get WebSocket messages only
const wsMessages = backendLogger.getLogsByType('WEBSOCKET_EVENT');
```

### Export for External Analysis

```javascript
// Export to CSV for Excel
const csv = backendLogger.exportLogsCSV();
console.log(csv);

// Or download directly
backendLogger.downloadLogs('csv');
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend is running and accessible
- [ ] npm dependencies installed
- [ ] `npm run log:backend` completes without errors
- [ ] Log files created in `logs/` directory
- [ ] Debug panel appears in browser (bottom-right 🔧)
- [ ] Debug panel shows API calls in real-time
- [ ] Statistics display correctly
- [ ] Can download logs as JSON/CSV

---

## 🤝 Support

If you encounter issues:

1. 📖 Check [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) for detailed documentation
2. 🔍 Review backend logs at: `http://192.168.1.33:8000/docs`
3. 💻 Check browser console for errors: Press F12 → Console tab
4. 📝 Review generated logs: Check `logs/backend-log-*.json`

---

**Happy logging! 🚀📊✨**
