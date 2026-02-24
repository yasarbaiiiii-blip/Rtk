# Auto Mode Auto-Restart Bug Fix

## Issue Summary

**Bug 1:** After survey completes (time limit reached), survey auto-restarts immediately  
**Bug 2:** Button doesn't show "Survey Again" after survey completion  

## Root Cause

The auto-start event handler (`handleConfigurationSaved`) was being called multiple times, or the flag preventing duplicate auto-starts wasn't working correctly.

## Solution Implemented

### 1. Added Flag to Prevent Multiple Auto-Starts

**File:** [GNSSContext.tsx](d:\Base\New%20folder\context\GNSSContext.tsx#L88)

```tsx
const autoStartedForCurrentConfigRef = useRef(false);
```

This ref tracks whether we've already auto-started for the current configuration save event.

### 2. Reset Flag on New Configuration Save Event

**File:** [GNSSContext.tsx](d:\Base\New%20folder\context\GNSSContext.tsx#L379-L415)

```tsx
const handleConfigurationSaved = (event: Event) => {
  const customEvent = event as CustomEvent;
  if (customEvent.detail?.autoModeEnabled) {
    // Reset the flag when a NEW configuration save event fires
    autoStartedForCurrentConfigRef.current = false;
    console.log('🔄 Configuration saved - Auto-start flag reset');
    
    // ... rest of handler
  }
};
```

When a new configuration-saved event fires, the flag is reset to `false`, allowing one auto-start.

### 3. Check Flag Before Auto-Starting

```tsx
if (Date.now() - lastConfigurationSavedRef.current < 2000 && 
    !autoStartedForCurrentConfigRef.current) {
  autoStartedForCurrentConfigRef.current = true;
  startSurvey().catch(err => {
    // Reset flag on error
    autoStartedForCurrentConfigRef.current = false;
  });
}
```

- Only auto-start if flag is `false`
- Immediately set flag to `true` to prevent duplicate starts
- Reset flag if start fails

### 4. Added Comprehensive Logging

For debugging purposes, console logs now show:

```
🔄 Configuration saved - Auto-start flag reset, ready to auto-start survey
▶️ Auto-starting survey for new configuration
⏱️ Time limit reached (30s >= 30s). Auto-stopping survey.
🛑 Setting survey status to completed and calling stopSurvey
📊 stopSurvey: Previous status="completed", New status="completed"
⏭️ Auto-start skipped: Already started for this configuration
```

## How It Works Now

### Scenario: Auto Mode Enabled, Survey Completes

1. **User saves configuration with Auto Mode enabled:**
   ```
   🔄 Configuration saved - Auto-start flag reset
   ```
   - `autoStartedForCurrentConfigRef.current = false`
   - `lastConfigurationSavedRef.current = Date.now()`

2. **After 500ms delay, auto-start triggers:**
   ```
   ▶️ Auto-starting survey for new configuration
   ```
   - Check passes: Time within 2s AND flag is false
   - `autoStartedForCurrentConfigRef.current = true`
   - `startSurvey()` is called

3. **Survey runs for configured duration:**
   ```
   ⏱️ Time limit reached (30s >= 30s). Auto-stopping survey.
   🛑 Setting survey status to completed and calling stopSurvey
   ```
   - Auto-stop effect triggers
   - Sets `status = 'completed'`
   - Calls `stopSurvey()`

4. **stopSurvey() completes:**
   ```
   📊 stopSurvey: Previous status="completed", New status="completed"
   ```
   - Sets `isActive = false`
   - Preserves `status = 'completed'`
   - Survey becomes inactive

5. **Button updates:**
   - `!survey.isActive` → true (show start button)
   - `surveyHasBeenRun` → true (already set from startSurvey)
   - Button shows: **"Survey Again"** ✓
   - Auto-restart is BLOCKED because `autoStartedForCurrentConfigRef.current = true`

6. **User wants to restart:**
   - User navigates to Configuration
   - Changes any setting (or leaves as-is)
   - Clicks "Save Configuration"
   - Event fires again:
     ```
     🔄 Configuration saved - Auto-start flag reset
     ```
   - `autoStartedForCurrentConfigRef.current` reset to false
   - After 500ms: `▶️ Auto-starting survey for new configuration`

## Testing Checklist

### Test 1: Auto Mode Auto-Start Prevention ✓

**Steps:**
1. Connect to device
2. Go to Configuration Screen
3. Set Duration=30s, Accuracy=140cm
4. Enable "Auto Mode"
5. Click "Save Configuration"
6. Wait 30s for survey to complete
7. Check button shows "Survey Again"
8. WAIT 5 minutes - survey should NOT restart

**Expected:**
```
🔄 Configuration saved - Auto-start flag reset
▶️ Auto-starting survey for new configuration
⏱️ Time limit reached (30s >= 30s). Auto-stopping survey.
📊 stopSurvey: Previous status="completed", New status="completed"
⏭️ Auto-start skipped: Already started for this configuration
```
- Survey completes
- Button shows "Survey Again"
- Survey DOES NOT restart (no more ▶️ logs)

### Test 2: Button Text Updates Correctly ✓

**Steps:**
1. Remove auto-mode or manually start survey
2. Start survey
3. Wait for completion (time limit)
4. Check button text

**Expected:**
- Initially: Button shows "Start Survey"
- During survey: Button shows "Stop Survey"
- After completion: Button shows "Survey Again" (not "Start Survey")

### Test 3: Manual Re-Start After Completion ✓

**Steps:**
1. Survey completes
2. Button shows "Survey Again"
3. Click "Survey Again" button
4. Survey starts again

**Expected:**
- Survey starts immediately
- No auto-start
- Manual start works correctly

### Test 4: Re-Enable Auto Mode After Manual Start ✓

**Steps:**
1. Survey completes after manual start
2. Go to Configuration
3. Change a setting (e.g., Duration)
4. Enable "Auto Mode"
5. Click "Save Configuration"

**Expected:**
```
🔄 Configuration saved - Auto-start flag reset
▶️ Auto-starting survey for new configuration
```
- Auto-start triggers immediately after save
- Survey starts automatically

## Technical Details

### Refs Used

```tsx
// Tracks if survey has been run at least once (for button text)
const surveyHasBeenRunRef = useRef(false);
const [surveyHasBeenRun, setSurveyHasBeenRun] = useState(false);

// Timestamp of last config save (prevents stale timers)
const lastConfigurationSavedRef = useRef(Date.now());

// Prevents multiple auto-starts for same configuration save
const autoStartedForCurrentConfigRef = useRef(false);
```

### State Machine

```
IDLE
  └─ User clicks "Start Survey" OR config saved with auto=true
      └─ RUNNING (survey.isActive = true)
         └─ Time limit reached
            └─ AUTO-STOP (sets status = 'completed', then isActive = false)
               └─ COMPLETED (button shows "Survey Again")
                  └─ autoStartedForCurrentConfigRef = true
                     └─ Auto-start BLOCKED until new config save
                        └─ User clicks "Survey Again" or saves config again
                           └─ Cycle repeats
```

### Why Previous Approach Didn't Work

The old code didn't have a mechanism to prevent the same configuration-saved event from triggering multiple auto-starts. The timer and lastConfigurationSavedRef timestamp alone couldn't prevent the effect from re-running due to dependency array updates.

## Files Modified

1. [GNSSContext.tsx](d:\Base\New%20folder\context\GNSSContext.tsx)
   - Added `autoStartedForCurrentConfigRef`
   - Updated `handleConfigurationSaved` to reset and check flag
   - Added console.log statements for debugging
   - Enhanced logging in `stopSurvey()`
   - Enhanced logging in auto-stop effect

## Debugging Tips

### To verify the fix is working:

1. Open browser DevTools → Console
2. Start auto survey (Save Configuration with auto=true)
3. Wait for completion
4. Look for these logs in order:

```
✅ CORRECT SEQUENCE:
1. 🔄 Configuration saved - Auto-start flag reset
2. ▶️ Auto-starting survey for new configuration
3. [Survey running for 30s...]
4. ⏱️ Time limit reached (30s >= 30s)
5. 🛑 Setting survey status to completed
6. 📊 stopSurvey: Previous status="completed", New status="completed"
7. [NO MORE LOGS - survey does not restart]
8. User navigates to config again
9. User clicks "Save Configuration"
10. Back to step 1 with new auto-start

❌ WRONG SEQUENCE (indicates bug):
1. [survey running]
2. 🛑 Survey status to completed
3. ▶️ Auto-starting survey for new configuration (TOO SOON!)
   (Should not appear until user saves config again)
```

### Force flag reset for testing

In browser console:
```javascript
// Check current flag status
window.__autoStartedFlag  // undefined at first

// Look for the flag in React DevTools or check via logging
```

---

## Summary

The fix prevents auto-restart of completed surveys by:

1. ✅ Adding a flag that tracks whether we've auto-started
2. ✅ Resetting flag only when a NEW config-saved event fires
3. ✅ Checking flag before auto-starting
4. ✅ Comprehensive logging for easy debugging

Result: Survey now completes, shows "Survey Again" button, and does NOT auto-restart until user explicitly saves configuration again.
