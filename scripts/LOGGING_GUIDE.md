# 📊 Backend Data Logging Guide

Complete guide for logging GNSS backend data through all endpoints and WebSocket events.

---

## 🎯 Overview

There are **3 ways** to log backend data:

| Method | Use Case | Location |
|--------|----------|----------|
| **Node.js Script** | Standalone backend monitoring | `scripts/logBackendData.js` |
| **TypeScript Script** | Development & debugging | `scripts/logBackendData.ts` |
| **Browser Logger** | Real-time frontend integration | `src/utils/backendLogger.ts` |
| **Debug Panel** | Visual UI for logs | `src/app/components/BackendLoggerDebugPanel.tsx` |

---

## 🚀 Quick Start

### Option 1: Node.js Script (Recommended for Backend Testing)

```bash
# Install dependencies
npm install node-fetch ws

# Run the logging script
node scripts/logBackendData.js

# Or with npm script (add to package.json)
npm run log:backend
```

**What it does:**
- ✅ Tests all 5 GET endpoints
- ✅ Tests all 5 POST endpoints (Survey, RTCM, NTRIP)
- ✅ Connects to WebSocket and receives 5 messages
- ✅ Saves detailed logs to `logs/backend-log-TIMESTAMP.json`
- ✅ Prints formatted console output

**Output:**
```
📡 [2025-02-16T14:30:45.123Z] ENDPOINT: /api/v1/health
   📊 Status: 200
   ⏱️  Duration: 45.23ms

📡 [2025-02-16T14:30:46.456Z] ENDPOINT: /api/v1/status
   📊 Status: 200
   ⏱️  Duration: 52.15ms
   
... (continues logging all endpoints and WebSocket events)
```

---

### Option 2: Browser-based Logger (Real-time Frontend)

#### Step 1: Add the Debug Panel to Your App

```tsx
// src/app/App.tsx
import { BackendLoggerDebugPanel } from './components/BackendLoggerDebugPanel';

export const App = () => {
  return (
    <div>
      {/* Your app content */}
      <YourMainContent />
      
      {/* Add the debug panel */}
      <BackendLoggerDebugPanel />
    </div>
  );
};
```

#### Step 2: Use in Your Components

```tsx
// src/app/components/Dashboard.tsx
import { useEffect } from 'react';
import { backendLogger } from '../../utils/backendLogger';

export const Dashboard = () => {
  useEffect(() => {
    // Connect to WebSocket for real-time logs
    backendLogger.connectWebSocket().catch(console.error);

    // Test all endpoints
    backendLogger.testAllEndpoints();

    return () => {
      backendLogger.disconnectWebSocket();
    };
  }, []);

  return (
    <div>
      {/* Dashboard content */}
    </div>
  );
};
```

#### Step 3: Access Debug Features

Once the app is running:

1. **Click the 🔧 button** in the bottom-right corner
2. **View all logs** in real-time
3. **Test endpoints** with the "Test API" button
4. **Download logs** as JSON or CSV
5. **View statistics** including response times and error counts

**Features:**
- 🔴 Automatic interception of all API calls
- 🟢 WebSocket event monitoring
- 📊 Statistics dashboard
- 📥 Download logs (JSON/CSV)
- 🔍 Filter by log type
- 📝 Expandable log details

---

## 📋 API Endpoints Being Logged

### GET Endpoints (Read-Only)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | Backend health & GNSS connection status |
| `GET /api/v1/status` | Current GNSS position, fix type, accuracy |
| `GET /api/v1/survey` | Survey-In progress & base position |
| `GET /api/v1/rtcm` | RTCM correction statistics |
| `GET /api/v1/ntrip` | NTRIP stream status |

### POST Endpoints (Control)

| Endpoint | Purpose | Body |
|----------|---------|------|
| `POST /api/v1/survey/start` | Start Survey-In | `{min_duration_sec, accuracy_limit_m}` |
| `POST /api/v1/survey/stop` | Stop Survey-In | None |
| `POST /api/v1/rtcm/configure` | Configure RTCM | `{enable_beidou}` |
| `POST /api/v1/ntrip/start` | Start NTRIP stream | `{host, port, mountpoint, password, username}` |
| `POST /api/v1/ntrip/stop` | Stop NTRIP stream | None |

### WebSocket

| URL | Updates | Data |
|-----|---------|------|
| `ws://192.168.1.33:8000/ws/status` | Every 1.5s | Complete status (GNSS + Survey + RTCM + NTRIP) |

---

## 🔧 Advanced Usage

### Browser Logger - Programmatic Access

```typescript
import { backendLogger } from './utils/backendLogger';

// Subscribe to all log changes
const unsubscribe = backendLogger.subscribe((log) => {
  console.log('New log:', log);
});

// Get all logs
const allLogs = backendLogger.getLogs();

// Get logs of specific type
const apiCalls = backendLogger.getLogsByType('API_CALL');
const errors = backendLogger.getLogsByType('API_ERROR');

// Get logs for specific endpoint
const statusLogs = backendLogger.getLogsByEndpoint('/status');

// Get statistics
const stats = backendLogger.getStatistics();
console.log(`Average response time: ${stats.averageResponseTime}ms`);
console.log(`Total errors: ${stats.errors}`);

// Export logs
const jsonString = backendLogger.exportLogsJSON();
const csvString = backendLogger.exportLogsCSV();

// Clear logs
backendLogger.clearLogs();

// Manual WebSocket control
await backendLogger.connectWebSocket();
backendLogger.disconnectWebSocket();

// Unsubscribe when done
unsubscribe();
```

### Console Commands

You can also use the logger directly from browser console:

```javascript
// View all logs
window.backendLogger.getLogs()

// View statistics
window.backendLogger.printStatistics()

// Download logs
window.backendLogger.downloadLogs('json')

// Test all endpoints
window.backendLogger.testAllEndpoints()
```

---

## 📊 Log File Structure

Generated logs are saved in `logs/backend-log-TIMESTAMP.json`:

```json
[
  {
    "timestamp": "2025-02-16T14:30:45.123Z",
    "type": "ENDPOINT",
    "endpoint": "/api/v1/health",
    "method": "GET",
    "status": 200,
    "duration": 45.23,
    "data": {
      "status": "healthy",
      "gnss_connected": true,
      "uptime_seconds": 1234.56,
      "version": "1.0.0-phase6"
    }
  },
  {
    "timestamp": "2025-02-16T14:30:46.456Z",
    "type": "WEBSOCKET",
    "endpoint": "ws://192.168.1.33:8000/ws/status",
    "data": {
      "messageNumber": 1,
      "gnss": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "fix_type": "RTK Fixed",
        "num_satellites": 14
      }
    }
  },
  {
    "timestamp": "2025-02-16T14:30:50.789Z",
    "type": "API_ERROR",
    "endpoint": "/api/v1/survey/start",
    "error": "Network timeout",
    "duration": 5000
  }
]
```

---

## 🎨 Debug Panel UI

### Logs Tab
- View all API calls and WebSocket events
- Filter by type (API_CALL, API_RESPONSE, API_ERROR, WEBSOCKET_EVENT)
- Click to expand details (response data, error messages, duration)
- Color-coded by status (green for success, red for errors)

### Stats Tab
- Total number of logs
- Breakdown by type and endpoint
- Average API response time
- Total error count

---

## ✅ Common Tasks

### Test All Endpoints

**Node.js:**
```bash
node scripts/logBackendData.js
```

**Browser Console:**
```javascript
backendLogger.testAllEndpoints()
```

**React Component:**
```tsx
import { backendLogger } from '../../utils/backendLogger';

const handleTest = async () => {
  await backendLogger.testAllEndpoints();
};
```

### Monitor in Real-time

**Browser:**
```tsx
import { BackendLoggerDebugPanel } from './BackendLoggerDebugPanel';

<BackendLoggerDebugPanel />  // Click 🔧 button to open
```

### Export Logs for Analysis

**Node.js (Automatic):**
```bash
node scripts/logBackendData.js
# Logs saved to: logs/backend-log-2025-02-16T14-30-45-123Z.json
```

**Browser:**
```javascript
// Download as file
backendLogger.downloadLogs('json')  // or 'csv'

// Get as string
const jsonLogs = backendLogger.exportLogsJSON()
const csvLogs = backendLogger.exportLogsCSV()
```

---

## 🐛 Troubleshooting

### WebSocket Connection Fails

**Issue:** `WebSocket connection failed: connect ECONNREFUSED`

**Solutions:**
1. ✅ Verify backend server is running: `http://192.168.1.33:8000/docs`
2. ✅ Check network: Can you ping `192.168.1.33`?
3. ✅ Verify WebSocket URL: `ws://192.168.1.33:8000/ws/status`

### Node Script Requires Dependencies

**Issue:** `Cannot find module 'ws'`

**Solution:**
```bash
npm install ws node-fetch
```

### Browser Logger Not Capturing Some Calls

**Issue:** Some API calls not appearing in logs

**Solution:**
- The logger intercepts `window.fetch()` calls
- If using XMLHttpRequest or other methods, they won't be captured
- Always use the `api` object from `src/api/gnssApi.ts`

### Logs Too Large

**Issue:** Browser memory usage high after many requests

**Solution:**
```javascript
// Clear logs manually
backendLogger.clearLogs()

// Or adjust max logs in backendLogger.ts
private maxLogs: number = 1000;  // Change to lower value
```

---

## 📝 Setup Instructions

### 1. Add npm Scripts to `package.json`

```json
{
  "scripts": {
    "log:backend": "node scripts/logBackendData.js",
    "log:backend:ts": "ts-node scripts/logBackendData.ts",
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2. Add Logging to React App

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { backendLogger } from './utils/backendLogger';

// Make logger available globally for debugging
if (import.meta.env.MODE === 'development') {
  (window as any).backendLogger = backendLogger;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 3. Add Debug Panel to App

```tsx
// src/app/App.tsx
import { BackendLoggerDebugPanel } from './components/BackendLoggerDebugPanel';

export const App = () => {
  return (
    <>
      {/* Your app */}
      <MainContent />
      
      {/* Debug panel */}
      {import.meta.env.MODE === 'development' && (
        <BackendLoggerDebugPanel />
      )}
    </>
  );
};
```

---

## 📚 Files Reference

```
scripts/
├── logBackendData.js        ← Standalone Node.js script
├── logBackendData.ts        ← TypeScript version
└── README.md                ← This file

src/
├── utils/
│   └── backendLogger.ts     ← Browser logger utility
└── app/components/
    └── BackendLoggerDebugPanel.tsx  ← React debug component

logs/
└── backend-log-*.json       ← Generated log files
```

---

## 🎯 Summary

| Task | Command/Code |
|------|-------------|
| **Quick test** | `npm run log:backend` |
| **Real-time monitoring** | Click 🔧 in app + "Test API" |
| **Export logs** | `backendLogger.downloadLogs('json')` |
| **View statistics** | Debug Panel → Stats tab |
| **Check response times** | Console: `backendLogger.printStatistics()` |
| **Monitor WebSocket** | Debug Panel (auto-monitors) |

---

**Happy logging! 🚀📊**
