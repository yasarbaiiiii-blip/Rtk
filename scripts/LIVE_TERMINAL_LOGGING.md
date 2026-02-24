# 🖥️ Live Terminal Logging System

Complete guide for live UI action logging to your VS Code terminal.

---

## 🚀 Quick Start (2 Steps)

### Step 1: Start the Terminal Logger Server
```bash
npm run log:terminal
```

Expected output:
```
================================================
🖥️  Terminal Logger Server Started
================================================
📍 Server running on http://localhost:3001
📝 Receiving logs from UI...
💡 Make sure UI is running at http://localhost:5173
================================================
```

### Step 2: Run Your Dev Server
```bash
npm run dev
```

Or do both at once in different terminals:
```bash
# Terminal 1
npm run log:terminal

# Terminal 2
npm run dev
```

---

## 📊 What Gets Logged

Every UI action is automatically logged:

### Connection Actions
```
✨ [14:30:45] {ConnectionScreen} Connecting via WIFI
📊 {type: "wifi", identifier: "Network-Name"}
✨ [14:30:46] {ConnectionScreen} Connected Successfully via WIFI
```

### Survey Actions
```
✨ [14:31:00] {SurveyStatus} Start Survey Button Clicked
📊 {duration: 120, accuracy: 1}
✨ [14:31:01] {SurveyStatus} Survey Started Successfully
✨ [14:31:02] {SurveyStatus} Survey Progress: 0.8%
📊 {elapsedTime: 1, accuracy: "2.5cm"}
```

### Stream Actions
```
✨ [14:32:00] {GNSSContext} Enable ntrip stream
⏱️  150.25ms
✨ [14:32:01] {GNSSContext} NTRIP stream started
```

### Network Actions
```
✨ [14:33:00] {ConnectionScreen} Scanning for WIFI networks
✨ [14:33:02] {ConnectionScreen} WiFi Scan Complete
📊 {networks: 5}
```

### Errors
```
❌ [14:34:00] {SurveyStatus} Start Survey Failed
❌ Error: Network timeout
```

---

## 📈 Understanding the Log Format

Each log entry follows this pattern:

```
[ICON] [TIMESTAMP] {COMPONENT} ACTION
📊 {DATA}
⏱️  DURATION
```

| Element | Meaning |
|---------|---------|
| 🔧 Icon | Type of action (✨=success, ❌=error, ⚡=important) |
| TIMESTAMP | Time the action occurred (HH:MM:SS) |
| COMPONENT | Which component performed the action |
| ACTION | What action was performed |
| DATA | Associated data (optional) |
| DURATION | How long it took (optional) |

---

## 🎯 Common Workflows

### Monitor Survey Progress
```
1. Start Terminal Server: npm run log:terminal
2. Open app: npm run dev
3. Click "Start Survey"
4. Watch real-time progress in terminal:
   ✨ [14:31:01] Survey Progress: 0.8%
   ✨ [14:31:02] Survey Progress: 1.6%
   ✨ [14:31:03] Survey Progress: 2.4%
   ... (continues every second)
```

### Debug Connection Issues
```
1. Terminal window shows all connection attempts
2. If connection fails, error message appears immediately
3. Shows exactly what went wrong
4. Helps debug WiFi/BLE problems
```

### Track API Calls
```
1. Every API call is logged with response time
2. Shows data being sent and received
3. Identifies slow endpoints
```

### Monitor Stream Operations
```
1. See when NTRIP/RTCM streams start/stop
2. Monitor WebSocket connections
3. Track data rates and errors
```

---

## 💡 Tips & Tricks

### Filter Logs in Terminal
```bash
# Show only errors
grep "❌" terminal_output.log

# Show only survey logs
grep "Survey" terminal_output.log

# Show only connection logs
grep "Connection" terminal_output.log
```

### Keep Terminal Open for Testing
Keep the terminal server running while developing:
```bash
npm run log:terminal
# Leave this running, open new terminal for npm run dev
```

### Redirect Logs to File
```bash
npm run log:terminal > app-logs.txt 2>&1
```

### Real-time Log Monitoring
```bash
npm run log:terminal | grep "❌"  # Only show errors
npm run log:terminal | tee app-logs.txt  # Both terminal and file
```

---

## 🔧 How It Works

```
UI Action Clicked
    ↓
uiLogger.log() called
    ↓
Logs to browser console
    ↓
Sends HTTP POST to localhost:3001
    ↓
Terminal Server receives at /log endpoint
    ↓
Formats and prints in terminal
```

---

## 📝 Adding Logging to Your Code

To add logging to any component:

```tsx
import { uiLogger } from '../utils/uiLogger';

const handleAction = async () => {
  // Log action start
  uiLogger.log('Action Started', 'ComponentName', { data: 'here' });

  try {
    // Do something
    await someAsyncOperation();
    
    // Log success
    uiLogger.log('Action Completed', 'ComponentName');
  } catch (error) {
    // Log error
    uiLogger.log(
      'Action Failed',
      'ComponentName',
      undefined,
      error.message
    );
  }
};
```

### uiLogger.log() Method Signature
```typescript
uiLogger.log(
  action: string,        // What happened
  component: string,     // Which component
  data?: unknown,        // Optional data
  error?: string,        // Optional error message
  duration?: number      // Optional duration in ms
)
```

---

## 🐛 Troubleshooting

### Terminal Server Won't Start

**Issue:** `EADDR IN USE` error

**Solution:**
```bash
# Kill process on port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3001
kill -9 <PID>
```

### Logs Not Appearing

**Issue:** Terminal server running but no logs shown

**Solution:**
1. ✅ Make sure UI is running at `http://localhost:5173`
2. ✅ Check browser console for errors (F12)
3. ✅ Verify terminal server is running on `http://localhost:3001`
4. ✅ Check network tab to see POST requests to `/log`

### Terminal Server Crashes

**Solution:**
```bash
# Restart it
npm run log:terminal
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `src/utils/uiLogger.ts` | UI logging utility |
| `scripts/logTerminalServer.js` | Terminal logger server |
| `package.json` | Contains npm scripts |
| Log entries | Stay in `logs/` directory |

---

## ⚡ Features Logging

Currently logs from:
- ✅ **Connection** - WiFi/BLE connect/scan
- ✅ **Survey** - Start/stop/progress
- ✅ **Configuration** - Settings changes
- ✅ **Streams** - NTRIP/RTCM enable/disable
- ✅ **Coordinates** - Copy/format actions
- ✅ **Errors** - All caught exceptions

---

## 🎯 Next Steps

1. **Run the system:** `npm run log:terminal` & `npm run dev`
2. **Use the app** and watch logs appear
3. **Debug issues** using the terminal output
4. **Add more logging** to components as needed

---

## 📖 More Resources

- [uiLogger API](../src/utils/uiLogger.ts) - Logging utility
- [Terminal Server Code](./logTerminalServer.js) - How it works
- [Backend Logging Guide](./LOGGING_GUIDE.md) - API logging

---

**Happy logging! 🖥️✨**

Your terminal is now a real-time UI event monitor! 🎉
