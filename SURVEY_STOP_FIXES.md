# Survey Stop Issues - Fixes Applied

## Summary of Issues
1. **Survey doesn't stop when accuracy is met** - In both manual and auto modes, the survey continues running even after accuracy target is reached
2. **Manual stop button failures** - Clicking "Stop Survey" sometimes results in: `API Error 500: Failed to stop Survey-In`

## Root Causes Identified

### Issue 1: Accuracy Stop Logic (AND vs OR)
**Location:** [src/context/GNSSContext.tsx#L345-L363](src/context/GNSSContext.tsx#L345-L363)

**Problem:** The auto-stop condition used AND logic:
```typescript
if (timeMet && accuracyMet) // BOTH must be true
```
This means the survey only stops when BOTH time AND accuracy requirements are met. If accuracy is reached before time is completed, the survey continues waiting for the timer to expire.

**Fix:** Changed to OR logic:
```typescript
if (timeMet || accuracyMet) // EITHER can be true
```
Now the survey stops as soon as EITHER condition is met, with better logging to indicate which condition triggered the stop.

---

### Issue 2: WebSocket Override After Failed Stop
**Location:** [src/context/GNSSContext.tsx#L181-L185](src/context/GNSSContext.tsx#L181-L185)

**Problem:** When the API fails to stop the survey (500 error):
1. Frontend sets `isActive: false` optimistically
2. Backend still thinks survey is running and sends WebSocket updates
3. The filter checked: `if (stoppingRef.current && wsActive) return prev;` but this only prevented updates if BOTH conditions were true
4. After 1 second timeout, WebSocket updates could override the local stop

**Fix:** Changed the WebSocket filter to completely ignore ALL survey updates while stopping:
```typescript
if (stoppingRef.current) {
  return prev; // Don't update survey status while stopping - IGNORE ALL messages
}
```
This ensures no WebSocket message can override our local stop decision while we're in the stopping sequence.

---

### Issue 3: Backend Stop API Failures
**Location:** [src/context/GNSSContext.tsx#L265-L285](src/context/GNSSContext.tsx#L265-L285)

**Problem:** When the backend returns 500 error:
- The frontend stops immediately (good)
- But doesn't retry, just logs the error
- User is left unsure if survey truly stopped on the backend

**Fix:** Added retry mechanism with exponential backoff:
```typescript
let stopAttempts = 0;
let maxRetries = 2;

while (stopAttempts < maxRetries && !stopSucceeded) {
  // Try to stop, with 500ms delay between attempts
  // If all attempts fail, force local stop and log warning
}
```

**Behavior:**
- Attempt 1: Try to stop
- If fails → wait 500ms → Attempt 2: Retry
- If still fails → Force local UI stop regardless
- Log all attempts so user knows what happened

---

### Issue 4: Insufficient Unlock Delay
**Original:** `setTimeout(..., 1000)` - 1 second
**Updated:** `setTimeout(..., 2000)` - 2 seconds

Gives backend more time to process the stop request before accepting new updates.

---

## Changes Made

### File: [src/context/GNSSContext.tsx](src/context/GNSSContext.tsx)

#### Change 1: WebSocket Message Filtering
- Lines 181-185: Improved the filter to completely ignore survey status updates while `stoppingRef.current` is true
- Prevents WebSocket from overriding local stop decisions

#### Change 2: Auto-Stop Condition Logic
- Lines 345-363: Changed from AND (`&&`) to OR (`||`) logic
- Now stops when accuracy is met, even before time expires
- Better console logging to indicate which condition triggered

#### Change 3: Stop Retry Mechanism
- Lines 265-285: Added retry logic with 2 attempts and 500ms delay between attempts
- Frontend remains stopped even if backend stop fails
- Detailed logging for debugging API issues

#### Change 4: Stoppingref Unlock Delay
- Lines 310-312: Increased timeout from 1000ms to 2000ms
- Gives backend more processing time

---

## Testing Recommendations

### Test 1: Accuracy-Based Stop
**Scenario:** Set accuracy threshold to 50cm and start survey
**Expected:** Survey stops as soon as accuracy reaches 50cm (even if time not elapsed)
**Verify:** Check console logs for: `Auto-Stop Triggered (Accuracy)`

### Test 2: Time-Based Stop (Backup)
**Scenario:** Set time to 30s with accuracy of 5m
**Expected:** Survey stops after 30 seconds if accuracy not reached
**Verify:** Check console logs for: `Auto-Stop Triggered (Time)`

### Test 3: Manual Stop with API Failure
**Scenario:** Click "Stop Survey" when backend is unreachable/failing
**Expected:** 
- UI immediately shows stopped
- Retries shown in logs: "Stop attempt 1/2 failed, retrying..."
- After 2 failed attempts: "Backend stop failed... (UI stopped locally)"
- Survey history is saved
**Verify:** Survey doesn't restart or show as active after stop button is clicked

### Test 4: Rapid Stop Clicks
**Scenario:** Click "Stop Survey" multiple times quickly
**Expected:** Only one stop sequence runs; subsequent clicks are ignored while `stoppingRef.current` is true
**Verify:** Console shows only one "Stopping survey" message

---

## Backend Investigation Needed

The 500 error `Failed to stop Survey-In` suggests a backend issue:

### Possible Backend Problems:
1. **Survey state corruption** - Backend thinks survey is in invalid state for stopping
2. **Race condition** - Multiple stop requests arriving at same time
3. **Resource cleanup failure** - Backend unable to deallocate survey resources
4. **GNSS hardware issue** - Receiver not responding to stop command

### Backend Recommendations:
1. Add logging to see what state causes "Failed to stop Survey-In"
2. Implement idempotent stop (can safely call stop multiple times)
3. Add fallback/force-stop mechanism on backend
4. Consider timeout mechanism - if stop hangs > 5s, force-clean-up
5. Return more detailed error messages (not just 500)

---

## Files Modified
- [src/context/GNSSContext.tsx](src/context/GNSSContext.tsx) - Main context with survey logic

## Deployment Notes
- No breaking changes
- Fully backward compatible
- Enhanced error handling and resilience
- Better logging for debugging
- Build successful: ✓

