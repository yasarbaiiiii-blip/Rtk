# 🔍 Backend Logger - Quick Reference

## 🚀 Start Logging (Choose One)

### Node.js Script
```bash
# Windows
node scripts/logBackendData.js
# or double-click: scripts/logBackendData.bat

# Linux/Mac
./scripts/logBackendData.sh
```

### Browser Debug Panel
```tsx
// 1. Add to App.tsx
import { BackendLoggerDebugPanel } from './components/BackendLoggerDebugPanel';

// 2. In App component
<BackendLoggerDebugPanel />

// 3. Click 🔧 button in app (bottom-right)
```

### NPM Script
```bash
npm run log:backend      # Run once
npm run log:watch       # Continuous monitoring
```

---

## 📡 Logged Endpoints

| Type | Endpoint | Logs |
|------|----------|------|
| GET | `/api/v1/health` | Status, version, GNSS connection |
| GET | `/api/v1/status` | Position, fix type, satellites, accuracy |
| GET | `/api/v1/survey` | Survey-In progress, accuracy, observations |
| GET | `/api/v1/rtcm` | RTCM statistics, message rates |
| GET | `/api/v1/ntrip` | NTRIP status, uptime, bytes sent |
| POST | `/api/v1/survey/start` | Survey start response |
| POST | `/api/v1/survey/stop` | Survey stop response |
| POST | `/api/v1/rtcm/configure` | RTCM config response |
| POST | `/api/v1/ntrip/start` | NTRIP start response |
| POST | `/api/v1/ntrip/stop` | NTRIP stop response |
| WS | `/ws/status` | Real-time updates (1.5s) |

---

## 🖥️ Browser Console Commands

```javascript
// View logs
window.backendLogger.getLogs()

// Test all endpoints
window.backendLogger.testAllEndpoints()

// Download logs
window.backendLogger.downloadLogs('json')  // or 'csv'
window.backendLogger.downloadLogs('csv', true)

// Filter logs
window.backendLogger.getLogsByType('API_ERROR')
window.backendLogger.getLogsByEndpoint('/health')

// Statistics
window.backendLogger.printStatistics()
window.backendLogger.getStatistics()

// WebSocket
window.backendLogger.connectWebSocket()
window.backendLogger.disconnectWebSocket()

// Clear
window.backendLogger.clearLogs()

// Export
const json = window.backendLogger.exportLogsJSON()
const csv = window.backendLogger.exportLogsCSV()
```

---

## 📊 Log Entry Fields

```json
{
  "timestamp": "2025-02-16T14:30:45.123Z",   // When
  "type": "API_RESPONSE",                    // What: API_CALL|API_RESPONSE|API_ERROR|WEBSOCKET_EVENT
  "endpoint": "/api/v1/status",              // Where
  "method": "GET",                           // How: GET|POST
  "status": 200,                             // HTTP status
  "duration": 45.23,                         // ms
  "data": { /* response */ },                // Content
  "error": null                              // Any error
}
```

---

## 🎨 Debug Panel Features

| Feature | How |
|---------|-----|
| **View logs** | Click entries to expand |
| **Filter logs** | Click type buttons (All, API_CALL, etc.) |
| **Test endpoints** | Click "Test API" button |
| **Download logs** | Click "JSON" or "CSV" buttons |
| **View stats** | Click "Stats" tab |
| **Clear logs** | Click "Clear" button |

---

## 📈 Response Time Targets

| Time | Status | Notes |
|------|--------|-------|
| < 100ms | ✅ Excellent | Ideal response time |
| 100-300ms | ✅ Good | Acceptable |
| 300-1000ms | ⚠️ Warning | Slower than ideal |
| > 1000ms | ❌ Poor | Needs optimization |

---

## 🔧 Configuration

**Change Backend URL:**
```typescript
// src/api/gnssApi.ts (line 4)
const API_BASE = "http://192.168.1.33:8000";
```

**Change Log Limit:**
```typescript
// src/utils/backendLogger.ts (line 20)
private maxLogs: number = 1000;  // Or any number
```

**Show only in Development:**
```tsx
// src/app/App.tsx
{import.meta.env.MODE === 'development' && (
  <BackendLoggerDebugPanel />
)}
```

---

## 🐛 Troubleshoot

| Issue | Solution |
|-------|----------|
| **Module 'ws' not found** | `npm install ws` |
| **ECONNREFUSED** | Check backend is running at `http://192.168.1.33:8000/docs` |
| **Debug panel missing** | Ensure `npm run dev` (dev mode), check browser console |
| **No logs captured** | Use `api` object from `src/api/gnssApi.ts`, not bare fetch |
| **Logs too large** | Decrease `maxLogs` in backendLogger.ts or call `clearLogs()` |

---

## 📁 File Structure

```
scripts/
├── logBackendData.js           ← Node.js script
├── logBackendData.ts           ← TypeScript version
├── logBackendData.bat          ← Windows launcher
├── logBackendData.sh           ← Linux/Mac launcher
├── README.md                   ← Main guide
├── SETUP.md                    ← Integration steps
├── LOGGING_GUIDE.md            ← Detailed docs
└── QUICK_REFERENCE.md          ← This file

src/
├── utils/
│   └── backendLogger.ts        ← Browser logger
└── app/components/
    └── BackendLoggerDebugPanel.tsx ← Debug UI

logs/
└── backend-log-*.json          ← Generated logs
```

---

## ⚡ Common Tasks

### Check if Backend Works
```bash
npm run log:backend
```

### Monitor in Real-time
```bash
npm run log:watch
```

### Export Logs
```javascript
backendLogger.downloadLogs('json')
backendLogger.downloadLogs('csv')
```

### Get Response Times
```javascript
window.backendLogger.printStatistics()
```

### Test Specific Endpoint
```javascript
fetch('http://192.168.1.33:8000/api/v1/health')
  .then(r => r.json())
  .then(console.log)
```

### Find Errors
```bash
# Linux/Mac
grep "API_ERROR" logs/backend-log-*.json

# Windows
findstr "API_ERROR" logs\backend-log-*.json
```

---

## 📌 Key Shortcuts

```javascript
// Shortest versions
logger = window.backendLogger
logger.getLogs()           // Get all
logger.printStatistics()   // See stats
logger.downloadLogs('csv') // Export
logger.clearLogs()         // Clear
```

---

## 🎯 Typical Workflow

```
1. npm run dev                          # Start app
2. Click 🔧 in browser                  # Open debug panel
3. Click "Test API"                     # Test endpoints
4. Watch logs appear in real-time       # Monitor
5. Click "CSV" to download              # Export
6. Analyze in Excel or terminal         # Review
```

---

## 📚 More Info

- ✅ [SETUP.md](./SETUP.md) - Installation & integration
- 📖 [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) - Advanced features
- 🚀 [README.md](./README.md) - Overview

---

**💡 Pro Tips:**
- Keep debug panel open while developing to spot issues immediately
- Export CSV logs for analysis in Excel
- Use `npm run log:watch` for continuous monitoring
- Bookmark the backend docs: `http://192.168.1.33:8000/docs`

**Happy debugging! 🔧✨**
