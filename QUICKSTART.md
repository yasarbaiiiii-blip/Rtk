# ⚡ Quick Start Guide

## 🚀 Get Started in 60 Seconds

### Windows Users - Easiest Way
```powershell
# Just double-click this file in Explorer:
START.bat
```
Done! Two windows open automatically. Skip to **Step 4**.

---

### macOS/Linux or Manual Start

**Step 1**: Open first terminal
```bash
npm run log:terminal
```
You should see:
```
[Logger Server] Running on http://localhost:3001
[Logger Server] Listening for UI logs...
```

**Step 2**: Open second terminal
```bash
npm run dev
```
You should see:
```
  ➜  local:   http://localhost:5173/
```

**Step 3**: Open browser
- Go to `http://localhost:5173`
- App loads with the logger connected

**Step 4**: Start Testing
1. Click buttons in the app
2. Watch Terminal 1 for real-time logs
3. Start a survey - watch progress bars animate 0-100%
4. Check the 🔧 icon in browser for debug panel

---

## 📊 What You Should See

### Terminal 1 Output (Logger Server):
```
[14:35:22] ✨ APP_INITIALIZED
[14:35:25] 🔗 NAVIGATION     Navigated from HOME to DASHBOARD
[14:35:28] 📱 CONNECT_DEVICE WiFi connection attempt...
[14:35:30] ✅ CONNECTION_OK  Connected to 192.168.1.33:8000
[14:35:32] 📊 SURVEY_STARTED Duration: 600s, Accuracy target: 5cm
[14:35:33] 📈 PROGRESS       1% complete
...continues with live updates...
```

### Browser (App Screen):
- Two progress bars visible during survey
- Both animate from 0% → 100%
- Circular progress fills smoothly
- Horizontal bar extends smoothly

### Browser Debug Panel (🔧 button):
- Click the wrench icon bottom-right
- See all logs from this session
- Export as JSON/CSV if needed

---

## ✅ Verify It's Working

- [ ] Terminal 1 shows "Listening for UI logs..."
- [ ] Terminal 2 shows "http://localhost:5173"
- [ ] Browser loads the app
- [ ] Clicking buttons produces log entries
- [ ] 🔧 button visible in browser
- [ ] Start survey → progress bars animate
- [ ] Progress goes 0% → 100% smoothly

---

## 🎮 Try These Actions

1. **Navigation**
   - Click buttons to switch screens
   - Watch logs show navigation events

2. **Connection**
   - Click "Scan WiFi" or "Connect"
   - See network details in logs

3. **Survey** (Main test)
   - Click "Start Survey"
   - Watch both progress bars animate together
   - See real-time progress in terminal logs
   - Click "Stop Survey" to end

4. **Configuration**
   - Change any settings
   - Click "Save"
   - Watch logs show what changed

5. **Debug Panel**
   - Click 🔧 button in browser
   - Filter logs by type
   - Export data as JSON/CSV

---

## 🛑 Stop Everything

Press `Ctrl+C` in each terminal, or close the windows.

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Logger not receiving logs" | Make sure Terminal 1 is running `npm run log:terminal` |
| "Progress bars not moving" | Start a survey - they only show during active survey |
| "Cannot connect to backend" | Check backend server is running at `192.168.1.33:8000` |
| "Port 3001 already in use" | Kill process on that port or edit `logTerminalServer.js` |
| "No logs appearing" | Check browser console for errors (F12) |

---

## 📚 Full Documentation

For more details, see: [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

**Ready to go!** 🚀

