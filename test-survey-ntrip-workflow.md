# Survey to NTRIP Workflow Test

## Test Scenario

This test verifies that when a survey completes with acceptable accuracy, the `valid` field is set to `true` and NTRIP streaming starts automatically.

## Expected Workflow

1. **Start Survey**: User starts survey with accuracy target (e.g., 2m = 200cm)
2. **Survey Progress**: Survey runs, collecting position data
3. **Accuracy Met**: When accuracy reaches ≤ 200cm, survey should:
   - Set `valid: true` in survey state
   - Stop survey (auto-stop triggered by accuracy)
   - Auto-start NTRIP streaming using configured credentials
4. **NTRIP Active**: NTRIP status should show:
   - `enabled: true`
   - `connected: true`
   - `host`, `port`, `mountpoint` populated
   - `bytes_sent` > 0, `messages_sent` > 0

## API Endpoints to Monitor

### Survey Status
```bash
curl -X 'GET' 'http://192.168.1.33:8000/api/v1/survey' -H 'accept: application/json'
```

**Expected response during survey:**
```json
{
  "active": true,
  "valid": false,
  "progress_seconds": 45,
  "accuracy_m": 1.4375,
  "observations": 16,
  "mean_x_m": 1051036.64,
  "mean_y_m": 6124317.95,
  "mean_z_m": 1433153.32
}
```

**Expected response after accuracy met:**
```json
{
  "active": false,
  "valid": true,
  "progress_seconds": 0,
  "accuracy_m": 1.4375,
  "observations": 0,
  "mean_x_m": 1051036.64,
  "mean_y_m": 6124317.95,
  "mean_z_m": 1433153.32
}
```

### NTRIP Status
```bash
curl -X 'GET' 'http://192.168.1.33:8000/api/v1/ntrip' -H 'accept: application/json'
```

**Expected response after auto-start:**
```json
{
  "enabled": true,
  "connected": true,
  "host": "caster.emlid.com",
  "port": 2101,
  "mountpoint": "MP23960",
  "bytes_sent": 1024,
  "messages_sent": 5,
  "uptime_seconds": 30,
  "data_rate_bps": 34,
  "last_send_ago_seconds": 1
}
```

## Frontend Console Logs to Watch

1. **Survey Start**: `Starting survey: 120s / 200cm`
2. **Auto-Stop Trigger**: `Auto-Stop Triggered (Accuracy): Time(45s) >= 120s: false | Acc(143.75cm) <= 200cm: true`
3. **NTRIP Auto-Start**: `🛰️ Auto-starting NTRIP after survey validation:`
4. **NTRIP Success**: `✅ NTRIP auto-start successful`
5. **Log Entry**: `NTRIP started successfully - broadcasting RTK corrections`

## Configuration Required

Ensure NTRIP is configured in the frontend:
- **Server**: `caster.emlid.com`
- **Port**: `2101`
- **Mountpoint**: `MP23960`
- **Password**: `953ztv`
- **Username**: (empty or configured)

## Test Steps

1. **Configure NTRIP**: Go to Settings → Streams → NTRIP and enter credentials
2. **Set Survey Target**: Set accuracy threshold to 200cm (2m) for easier testing
3. **Start Survey**: Click "Start Survey" button
4. **Monitor Progress**: Watch survey progress and accuracy
5. **Verify Auto-Stop**: Survey should stop when accuracy ≤ 200cm
6. **Check NTRIP**: Verify NTRIP starts automatically and shows connected status
7. **Monitor Logs**: Check console and UI logs for success messages

## Troubleshooting

### If valid stays false:
- Check browser console for JavaScript errors
- Verify WebSocket connection to `ws://192.168.1.33:8000/ws/status`
- Ensure accuracy values are being received from backend

### If NTRIP doesn't auto-start:
- Verify NTRIP configuration is complete (server, port, mountpoint)
- Check network connectivity to NTRIP caster
- Look for NTRIP auto-start error messages in console

### If NTRIP fails to connect:
- Verify NTRIP credentials are correct
- Check firewall settings
- Test NTRIP connection manually using API endpoint

## Success Criteria

✅ Survey stops when accuracy target is met  
✅ `valid` field is set to `true` in survey state  
✅ NTRIP starts automatically with configured credentials  
✅ NTRIP shows as connected and streaming data  
✅ No error messages in console  
✅ UI shows appropriate success states  

## Files Modified

- `src/types/gnss.ts` - Added `valid` field to SurveyState
- `src/context/GNSSContext.tsx` - Implemented survey validation logic and auto-NTRIP start
- Frontend now handles survey completion independently of backend validation
