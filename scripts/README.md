# 🔍 Backend Data Logging Scripts

Complete logging system for GNSS backend API endpoints and WebSocket events.

**3 ways to log data:**
1. 🔧 **Node.js Script** - Standalone backend testing
2. 🌐 **Browser Logger** - Real-time frontend integration  
3. 🎨 **Debug Panel** - Visual UI for logs

---

## ⚡ Quick Start (30 seconds)

### Windows
```bash
node logBackendData.js
# Or double-click: logBackendData.bat
```

### Linux/Mac
```bash
chmod +x logBackendData.sh
./logBackendData.sh
# Or: node logBackendData.js
```

### In React App
1. Run `npm run dev`
2. Click 🔧 button (bottom-right)
3. Click "Test API"

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [SETUP.md](./SETUP.md) | **START HERE** - Step-by-step setup & integration |
| [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) | Advanced usage, troubleshooting, examples |
| [logBackendData.js](./logBackendData.js) | Standalone Node.js logging script |
| [logBackendData.ts](./logBackendData.ts) | TypeScript version |

---

## 📊 What Gets Logged?

### GET Endpoints
- ✅ `/api/v1/health` - Backend health
- ✅ `/api/v1/status` - GNSS position & fix type
- ✅ `/api/v1/survey` - Survey-In progress
- ✅ `/api/v1/rtcm` - RTCM statistics
- ✅ `/api/v1/ntrip` - NTRIP status

### POST Endpoints
- ✅ `/api/v1/survey/start` - Start survey
- ✅ `/api/v1/survey/stop` - Stop survey
- ✅ `/api/v1/rtcm/configure` - Configure RTCM
- ✅ `/api/v1/ntrip/start` - Start NTRIP
- ✅ `/api/v1/ntrip/stop` - Stop NTRIP

### WebSocket
- ✅ `ws://192.168.1.33:8000/ws/status` - Real-time updates (1.5s)

---

## 🚀 Usage Examples

### Test All Endpoints
```bash
npm run log:backend
```

### Monitor in Browser
```javascript
// In browser console
window.backendLogger.testAllEndpoints()
window.backendLogger.printStatistics()
window.backendLogger.downloadLogs('csv')
```

### Export Logs
```javascript
// Download as file
backendLogger.downloadLogs('json')  // or 'csv'

// Get as string
const json = backendLogger.exportLogsJSON()
```

---

## 📋 NPM Scripts to Add

Add to `package.json`:

```json
"scripts": {
  "log:backend": "node scripts/logBackendData.js",
  "log:watch": "nodemon scripts/logBackendData.js"
}
```

Then run:
```bash
npm run log:backend
npm run log:watch          # Continuous monitoring
```

---

## 🎯 Files Added

```
scripts/
├── logBackendData.js       ← Main logging script
├── logBackendData.ts       ← TypeScript version
├── logBackendData.bat      ← Windows launcher
├── logBackendData.sh       ← Linux/Mac launcher
├── README.md               ← This file
├── SETUP.md                ← Integration guide
└── LOGGING_GUIDE.md        ← Full documentation

src/
├── utils/
│   └── backendLogger.ts    ← Browser logger utility
└── app/components/
    └── BackendLoggerDebugPanel.tsx ← React debug panel

logs/
└── backend-log-*.json      ← Auto-generated logs
```

---

## 🔧 Configuration

**Backend URL:**
- Edit `src/api/gnssApi.ts` (line 4)
- Edit `scripts/logBackendData.js` (line 15)
- Change: `const API_BASE = "http://192.168.1.33:8000";`

**Log History Limit:**
- Edit `src/utils/backendLogger.ts` (line 20)
- Change: `private maxLogs: number = 1000;`

---

## ✅ Next Steps

1. **📖 Read** [SETUP.md](./SETUP.md) for integration steps
2. **🚀 Run** `npm run log:backend` to test
3. **🔍 View** logs generated in `../logs/` directory
4. **🎨 Add** debug panel to your app
5. **📚 Learn** more in [LOGGING_GUIDE.md](./LOGGING_GUIDE.md)

---

## 💡 Key Features

✨ **Automatic API Interception** - All fetch calls logged automatically
🔌 **WebSocket Monitoring** - Real-time status streams
📊 **Statistics Dashboard** - Response times, error counts, etc.
📥 **Export to JSON/CSV** - Download for analysis
🔍 **Real-time Filtering** - Filter by type, endpoint, etc.
🐛 **Error Tracking** - See what went wrong
⏱️ **Performance Metrics** - Identify bottlenecks

---

## 🆘 Quick Troubleshooting

**"Cannot find module 'ws'"**
```bash
npm install ws
```

**"ECONNREFUSED" error**
- Check: `http://192.168.1.33:8000/docs` in browser
- Verify backend is running

**Debug panel not showing**
- Make sure `npm run dev` (development mode)
- Check browser console for errors: Press F12

**No logs captured**
- Ensure using `api` object from `src/api/gnssApi.ts`
- Check that BackendLoggerDebugPanel is added to App

---

## 📖 Full Documentation

For complete documentation and examples, see:
- **Setup Guide:** [SETUP.md](./SETUP.md)
- **Advanced Usage:** [LOGGING_GUIDE.md](./LOGGING_GUIDE.md)

---

## 🎯 Summary

| Need | Command/Action |
|------|----------------|
| Test endpoints | `npm run log:backend` |
| Real-time monitor | Click 🔧 in app |
| Export logs | `backendLogger.downloadLogs('json')` |
| View stats | Debug panel → Stats tab |
| Continuous watch | `npm run log:watch` |

---

**Start with [SETUP.md](./SETUP.md) → 5 minute setup! 🚀**
