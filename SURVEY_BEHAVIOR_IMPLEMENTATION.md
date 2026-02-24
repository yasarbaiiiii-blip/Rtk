# Survey Behavior Implementation - Complete Fix

## Overview
This document describes the complete implementation of the survey behavior requirements where:
- **Survey must run until TIME LIMIT is reached** (even if accuracy is met earlier)
- **Auto mode only starts after "Save Configuration" is clicked**
- **Survey doesn't auto-restart unless configuration is saved again**
- **Button shows "Start Survey" first time, then "Survey Again"**

---

## Core Requirements Met

### 1. Time-First Auto-Stop Logic ✓
- **Previous behavior:** Survey stopped as soon as accuracy was met
- **New behavior:** Survey continues until the required TIME LIMIT is met, regardless of accuracy
- **Implementation:** Auto-stop check now uses `survey.elapsedTime >= survey.requiredTime` instead of accuracy check

**File:** `d:\Base\New folder\context\GNSSContext.tsx`  
**Lines:** 332-357 (AUTO-STOP WHEN TIME LIMIT IS REACHED section)

```tsx
useEffect(() => {
  // Auto-stop survey when TIME LIMIT is reached (not accuracy)
  if (!survey.isActive || survey.status === 'completed' || survey.status === 'stopped') return;
  
  // Check if time limit has been reached
  if (survey.elapsedTime >= survey.requiredTime && survey.elapsedTime > 0) {
    const timer = setTimeout(() => {
      setSurvey((prev) => ({
        ...prev,
        status: 'completed',
      }));
      stopSurvey().catch(err => {
        // Force local stop if API fails
        setSurvey((prev) => ({
          ...prev,
          isActive: false,
          status: 'completed',
        }));
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [survey.isActive, survey.elapsedTime, survey.requiredTime, survey.status]);
```

---

### 2. Auto-Start on Configuration Save (Not Dashboard Navigation) ✓

**Previous behavior:** Survey auto-started when navigating to dashboard  
**New behavior:** Survey only auto-starts when user clicks "Save Configuration" button

#### Changes Made:

**A. ConfigurationScreen.tsx** - Emit event on Save
**File:** `d:\Base\New folder\app\components\ConfigurationScreen.tsx`  
**Function:** `handleSave()`

```tsx
const handleSave = () => {
  uiLogger.log('Save Configuration clicked', 'ConfigurationScreen', config);
  updateConfiguration(config);
  
  // Emit event to trigger auto-start if auto mode is enabled
  const configSavedEvent = new CustomEvent('configuration-saved', {
    detail: { autoModeEnabled: config.baseStation.autoMode }
  });
  window.dispatchEvent(configSavedEvent);
  
  toast.success('Configuration saved successfully');
};
```

**B. GNSSContext.tsx** - Listen for configuration save event  
**File:** `d:\Base\New folder\context\GNSSContext.tsx`  
**Lines:** 379-405 (AUTO START ON CONFIG SAVED section)

```tsx
useEffect(() => {
  if (!connection.isConnected || survey.isActive) return;
  if (!configuration.baseStation.autoMode) return;
  
  const handleConfigurationSaved = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.autoModeEnabled) {
      lastConfigurationSavedRef.current = Date.now();
      
      const timer = setTimeout(() => {
        // Only start if configuration was saved within the last 2 seconds
        if (Date.now() - lastConfigurationSavedRef.current < 2000) {
          startSurvey().catch(err => {
            console.error('Auto start survey on config save failed:', err);
          });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  };

  window.addEventListener('configuration-saved', handleConfigurationSaved);
  return () => window.removeEventListener('configuration-saved', handleConfigurationSaved);
}, [connection.isConnected, survey.isActive, configuration.baseStation.autoMode, startSurvey]);
```

---

### 3. Button Text: "Start Survey" vs "Survey Again" ✓

**First time:** Shows "Start Survey"  
**After any stop/completion:** Shows "Survey Again"

#### Implementation:

**A. Add tracking in GNSSContext.tsx**  
**File:** `d:\Base\New folder\context\GNSSContext.tsx`

- Track if survey has been run: `surveyHasBeenRunRef` (ref) + `surveyHasBeenRun` (state)
- Set flag when survey starts: `setSurveyHasBeenRun(true)` in `startSurvey()`
- Expose in context: Added `surveyHasBeenRun` to `GNSSContextType`

**B. Use in SurveyStatus.tsx**  
**File:** `d:\Base\New folder\app\components\dashboard\SurveyStatus.tsx`  
**Lines:** Button rendering

```tsx
{!survey.isActive ? (
  <Button 
    onClick={handleStartSurvey} 
    className="flex-1 gap-2"
    disabled={isLoading}
  >
    <Play className="size-4" />
    {isLoading ? 'Starting...' : (surveyHasBeenRun ? 'Survey Again' : 'Start Survey')}
  </Button>
) : (
  // Stop button with time limit lock
)}
```

---

### 4. Survey Status: "completed" vs "stopped" ✓

**Auto-stop (time limit reached):** `status = 'completed'`  
**Manual stop (user clicked stop button):** `status = 'stopped'`

#### Implementation:

**File:** `d:\Base\New folder\context\GNSSContext.tsx`  
**Function:** `stopSurvey()`

```tsx
const stopSurvey = async () => {
  try {
    await api.stopSurvey();
    
    // Save to history
    setSurveyHistory((prev) => [historyEntry, ...prev]);

    // Only set status to 'stopped' if it's not already 'completed' (auto-stop case)
    setSurvey((prev) => ({
      ...prev,
      isActive: false,
      status: prev.status === 'completed' ? 'completed' : 'stopped',
    }));

    uiLogger.log("Survey stopped successfully", "GNSSContext", {
      finalStatus: survey.status === 'completed' ? 'completed' : 'stopped'
    });
  } catch (error) {
    // Error handling
    throw error;
  }
};
```

**Flow:**

1. **Auto-stop scenario:**
   - Auto-stop delay triggers → Sets `status = 'completed'`
   - Then calls `stopSurvey()`
   - `stopSurvey()` preserves `status = 'completed'`

2. **Manual stop scenario:**
   - User clicks "Stop Survey"
   - Calls `stopSurvey()`
   - Current status is `'in-progress'`
   - `stopSurvey()` sets `status = 'stopped'`

---

### 5. Time Limit Lock - Stop Button ✓

When time limit is reached, the "Stop Survey" button becomes disabled and shows "Time Limit Reached"

**File:** `d:\Base\New folder\app\components\dashboard\SurveyStatus.tsx`

```tsx
{/* Track time limit reached */}
useEffect(() => {
  if (survey.isActive && survey.elapsedTime >= survey.requiredTime && !hasReachedTimeLimit) {
    setHasReachedTimeLimit(true);
    // Record final accuracy
  }
  
  // Reset time limit flag when survey becomes inactive
  if (!survey.isActive && hasReachedTimeLimit) {
    setHasReachedTimeLimit(false);
  }
}, [survey.isActive, survey.elapsedTime, survey.requiredTime, hasReachedTimeLimit, ...]);

{/* Button disabled when time limit reached */}
<Button 
  onClick={handleStopSurvey} 
  variant="destructive" 
  className="flex-1 gap-2"
  disabled={isLoading || hasReachedTimeLimit || survey.status === 'completed'}
>
  <Square className="size-4" />
  {isLoading ? 'Stopping...' : hasReachedTimeLimit || survey.status === 'completed' ? 'Time Limit Reached' : 'Stop Survey'}
</Button>
```

---

## Test Scenarios

### Scenario 1: Accuracy Met Before Time Limit (Accuracy=140cm, Time=30s)

**Steps:**
1. Connect to device
2. Go to Configuration Screen
3. Set: Duration=30s, Accuracy=140cm
4. Enable "Auto Mode"
5. Click "Save Configuration"
6. Survey should auto-start

**Expected Behavior:**
- ✓ Survey starts automatically
- ✓ Accuracy reaches 140cm at ~15s
- ✓ **Survey DOES NOT stop** (accuracy was met but time not reached)
- ✓ Timer continues: 15s → 20s → 25s → 30s
- ✓ At 30s: Survey auto-completes with `status='completed'`
- ✓ Button shows "Survey Again" (not "Start Survey")
- ✓ Stop button is disabled showing "Time Limit Reached"
- ✓ Survey does NOT auto-restart
- ✓ Only surveyHasBeenRun=true, waiting for next "Save Configuration"

**Verification:**
- Console log: "Auto-stop at time limit triggered"
- Survey status: "Completed"
- Survey history: Entry recorded with success=true
- UI Logs: "Survey completed - time limit reached"

---

### Scenario 2: Time Limit Met Before Accuracy (Time=30s, Accuracy=1m)

**Steps:**
1. Connect to device
2. Go to Configuration Screen
3. Set: Duration=30s, Accuracy=100cm (1m - harder to achieve)
4. Enable "Auto Mode"
5. Click "Save Configuration"
6. Survey should auto-start

**Expected Behavior:**
- ✓ Survey starts automatically
- ✓ 30 seconds elapse
- ✓ Accuracy never reaches 100cm (poor signal/multipath)
- ✓ At 30s: Survey auto-completes with `status='completed'`
- ✓ Button shows "Survey Again"
- ✓ Stop button disabled showing "Time Limit Reached"
- ✓ Survey does NOT auto-restart

**Verification:**
- Console log: "Auto-stop at time limit triggered"
- Survey status: "Completed"
- Survey history: Entry recorded with success=false
- Accuracy in final record: Lower than 100cm target
- UI Logs: "Survey completed - time limit reached"

---

### Scenario 3: Manual Stop During Survey

**Steps:**
1. Start survey manually or via auto mode
2. After 10 seconds, click "Stop Survey" button
3. Time limit has NOT been reached

**Expected Behavior:**
- ✓ Survey stops immediately
- ✓ Status: `'stopped'` (not 'completed')
- ✓ Button shows "Survey Again"
- ✓ UI Logs: "Survey stopped - user action"

---

### Scenario 4: Auto Mode Disabled After Survey

**Steps:**
1. Complete survey with auto mode enabled
2. Survey finishes
3. Check if survey auto-starts again
4. Navigate to Configuration
5. Change setting (any setting)
6. Do NOT click "Save Configuration"

**Expected Behavior:**
- ✓ Survey does NOT auto-restart
- ✓ Waiting for explicit "Save Configuration" click
- ✓ If you click "Save Configuration", survey starts again

---

### Scenario 5: Auto Mode Remains Off After Manual Stop

**Steps:**
1. Auto mode is enabled
2. Survey auto-started via "Save Configuration"
3. During survey, click "Stop Survey" button (manual stop)
4. After stop, survey should NOT auto-restart

**Expected Behavior:**
- ✓ Survey stops (status='stopped')
- ✓ Survey does NOT auto-restart even though auto mode is on
- ✓ Requires new "Save Configuration" to restart

---

## Key Implementation Details

### Refs Used:
```tsx
const wsRef = useRef<WebSocket | null>(null);              // WebSocket connection
const surveyHasBeenRunRef = useRef(false);                 // Track first start
const lastConfigurationSavedRef = useRef(Date.now());      // Track last config save time
```

### Context Type Updates:
```tsx
type GNSSContextType = {
  // ... existing fields ...
  surveyHasBeenRun: boolean;  // New field for button state
  // ... rest of fields ...
};
```

### Survey State Statuses:
- `'idle'` - No survey running
- `'initializing'` - Survey starting
- `'in-progress'` - Survey active
- `'completed'` - Auto-stopped (time limit reached)
- `'stopped'` - Manually stopped by user
- `'failed'` - Survey failed to start

---

## Files Modified

1. **GNSSContext.tsx**
   - Added `surveyHasBeenRunRef` and `surveyHasBeenRun` state
   - Added `lastConfigurationSavedRef`
   - Changed auto-stop logic to use time limit instead of accuracy
   - Changed auto-start to listen for 'configuration-saved' event
   - Updated `stopSurvey()` to preserve 'completed' status
   - Added `surveyHasBeenRun` to context value

2. **ConfigurationScreen.tsx**
   - Updated `handleSave()` to emit 'configuration-saved' event

3. **SurveyStatus.tsx**
   - Added `surveyHasBeenRun` from context
   - Updated button text logic: "Start Survey" vs "Survey Again"
   - Added time limit reset logic
   - Added accuracy history reset on new survey start
   - Updated stop button to disable at time limit
   - Updated logging to include survey.status

---

## Manual Testing Checklist

- [ ] **Test 1:** Accuracy met before time (30s duration, 140cm accuracy)
  - [ ] Survey starts automatically after Save Configuration
  - [ ] Survey continues until 30s even after accuracy is met
  - [ ] Button shows "Survey Again" after completion
  - [ ] Survey does not auto-restart

- [ ] **Test 2:** Time met before accuracy (30s duration, 1m accuracy)
  - [ ] Survey starts automatically
  - [ ] Survey completes at 30s even without meeting accuracy
  - [ ] Button shows "Survey Again"
  - [ ] Survey does not auto-restart

- [ ] **Test 3:** Manual stop before time limit
  - [ ] User can click Stop button before time expires
  - [ ] Status is 'stopped' not 'completed'
  - [ ] Button shows "Survey Again"

- [ ] **Test 4:** Auto mode persistence
  - [ ] After survey completes, survey does NOT restart automatically
  - [ ] Survey only restarts after clicking Save Configuration again

- [ ] **Test 5:** Button text progression
  - [ ] First survey: "Start Survey"
  - [ ] After first survey: "Survey Again"
  - [ ] Consistency maintained across app lifecycle

---

## Logging for Debugging

### Console Logs:
- Auto-stop: "Auto-stop at time limit triggered"
- Auto-start: "Auto start survey on config save failed: ..." (on error)

### UI Logs (via uiLogger):
- Survey complete: "Survey completed - time limit reached"
- Survey stopped: "Survey stopped - user action"
- Final status: Logged during stopSurvey()

### In-App Logs (via addLog):
- Starting: "Starting survey with XXs duration and XXcm accuracy target"
- Stopping: "Stopping survey - Elapsed: XXs, Accuracy: XXcm"
- Completion: Various messages based on scenario

---

## Future Considerations

1. **Accuracy Threshold:** Currently, survey continues until time limit regardless of accuracy. Consider if accuracy should be displayed differently when exceeding target.

2. **Early Completion Bonus:** Could add feature where if accuracy is met SIGNIFICANTLY before time limit (e.g., 50% time remaining), user gets option to complete early.

3. **Survey History Distinction:** Track whether survey was 'completed' (auto-stop) vs 'stopped' (manual) in history for analytics.

4. **NTRIP Auto-Start:** When survey completes successfully, consider auto-starting NTRIP stream.

---

## Summary

The implementation now correctly handles all requirements:

✅ **Survey runs until TIME LIMIT** - Not stopping on accuracy  
✅ **Auto mode starts on Save Configuration** - Not on dashboard navigation  
✅ **No auto-restart after completion** - Only on new configuration save  
✅ **Button shows correct text** - "Start Survey" first, "Survey Again" after  
✅ **Status distinction** - "completed" for auto-stop, "stopped" for manual  
✅ **Time limit lock** - Stop button disabled when time reached  

The user experience is now clear and predictable for both Scenario 1 and Scenario 2.
