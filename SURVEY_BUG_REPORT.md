# GNSS Survey State Management — Bug Report & Fix Documentation

**Project:** GNSS Base Station Application
**Affected Files:**
- `src/context/GNSSContext.tsx`
- `src/api/gnssApi.ts`

---

## Table of Contents

1. [Problem Summary](#1-problem-summary)
2. [Bug Catalogue](#2-bug-catalogue)
   - [BUG-001 — Survey status never set to `completed`](#bug-001)
   - [BUG-002 — `valid` field never read from backend](#bug-002)
   - [BUG-003 — `localCoordinates` never populated](#bug-003)
3. [Root Cause Analysis](#3-root-cause-analysis)
4. [Erroneous Code (Before Fix)](#4-erroneous-code-before-fix)
5. [Corrected Code (After Fix)](#5-corrected-code-after-fix)
6. [Backend vs. Frontend Behaviour Comparison](#6-backend-vs-frontend-behaviour-comparison)
7. [Data Flow Diagram](#7-data-flow-diagram)
8. [Verification Checklist](#8-verification-checklist)

---

## 1. Problem Summary

When the `POST /api/v1/survey/start` endpoint was called directly from a terminal (curl / REST client), the survey completed normally:

```
Terminal call result — survey in progress:
{
  "active": true,
  "valid": false,
  "progress_seconds": 7,
  "accuracy_m": 1.2514,
  "observations": 8,
  "mean_x_m": 1051038.85,
  "mean_y_m": 6124318.14,
  "mean_z_m": 1433153.04
}

Terminal call result — survey completed:
{
  "active": false,
  "valid": true,
  "progress_seconds": 30,
  "accuracy_m": 1.1702,
  "observations": 31,
  "mean_x_m": 1051038.86,
  "mean_y_m": 6124318.15,
  "mean_z_m": 1433152.94
}
```

When the same survey was triggered through the React application (`GNSSContext.tsx` → `gnssApi.ts`):

- The survey never transitioned to a **"Completed"** state in the UI.
- The badge always showed **"Stopped"** instead of **"Completed"** after the backend finished.
- The **"Local" coordinates tab** always showed `NIL` for all three axes.
- The `survey.valid` field in application state was permanently `false`.

---

## 2. Bug Catalogue

---

### BUG-001

**ID:** BUG-001
**Severity:** Critical
**Category:** State Logic — Incorrect Status Transition
**File:** `src/context/GNSSContext.tsx`
**Affected Locations:**
  - WebSocket message handler — `setSurvey` callback, `if (prev.isActive)` branch
  - HTTP poll handler — `setSurvey` callback inside `setInterval`

**Description:**

When the Raspberry Pi backend finishes the survey it sets:
```json
{ "active": false, "valid": true }
```

The application receives this data through two channels simultaneously:
1. The WebSocket at `ws://192.168.1.33:8000/ws/status`
2. The polling loop calling `GET /api/v1/survey` every 2 seconds

In both code paths the logic for computing the new `status` field was:

```
status = (active === false) ? 'stopped' : previousStatus
```

The condition never consulted the `valid` field. The result was that every natural survey completion was treated identically to a manual user-triggered stop. The UI badge showed **"Stopped"** and the green **"Completed"** state was permanently unreachable.

The `getDisplayStatus()` function in `SurveyStatus.tsx` (line 179–190) only returns `'Completed'` when `survey.status === 'completed'`:

```ts
const getDisplayStatus = () => {
  if (survey.status === 'completed') {
    return 'Completed';            // ← never reached
  }
  if (!survey.isActive) {
    return survey.status === 'stopped' ? 'Stopped' : 'Idle';
  }
  return 'In Progress';
};
```

**Impact:** Users could not distinguish between a survey that was manually cancelled and one that finished successfully with a valid position fix.

---

### BUG-002

**ID:** BUG-002
**Severity:** High
**Category:** State Logic — Field Never Consumed
**File:** `src/context/GNSSContext.tsx`
**Affected Locations:**
  - WebSocket `setSurvey` callback — `if (prev.isActive)` return object
  - HTTP poll `setSurvey` callback — return object

**Description:**

`SurveyState` (defined in `src/types/gnss.ts`, line 38–57) contains a `valid: boolean` field:

```ts
export interface SurveyState {
  surveyMode: SurveyMode;
  isActive: boolean;
  valid: boolean;          // ← exists in the type
  ...
}
```

The initial state in `GNSSContext.tsx` sets `valid: false`:

```ts
const [survey, setSurvey] = useState<SurveyState>({
  ...
  valid: false,
  ...
});
```

Neither the WebSocket handler nor the HTTP poll ever wrote a new value to `survey.valid`. The field was permanently `false` for the entire application lifetime regardless of what the backend reported.

**Impact:** Any component or logic that depends on `survey.valid` to determine whether a position fix is trustworthy would always receive `false`, even after a fully successful survey.

---

### BUG-003

**ID:** BUG-003
**Severity:** High
**Category:** State Logic — Backend Data Never Mapped to UI State
**File:** `src/context/GNSSContext.tsx`
**Affected Locations:**
  - WebSocket `setSurvey` callback — `if (prev.isActive)` return object
  - HTTP poll `setSurvey` callback — return object

**Description:**

The backend survey response includes four local-coordinate fields:

| Backend field     | Frontend `SurveyState` field       |
|-------------------|------------------------------------|
| `mean_x_m`        | `localCoordinates.meanX`           |
| `mean_y_m`        | `localCoordinates.meanY`           |
| `mean_z_m`        | `localCoordinates.meanZ`           |
| `observations`    | `localCoordinates.observations`    |

`SurveyState.localCoordinates` was initialised to all-zeros and never updated:

```ts
localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
```

`SurveyStatus.tsx` renders the **"Local"** tab coordinates directly from these fields:

```ts
const { meanX, meanY, meanZ } = survey.localCoordinates;
return {
  lat: meanX !== 0 ? meanX.toFixed(2) : 'NIL',
  lon: meanY !== 0 ? meanY.toFixed(2) : 'NIL',
  alt: meanZ !== 0 ? meanZ.toFixed(2) : 'NIL',
};
```

Because the values stayed at zero, the "Local" tab always displayed `NIL` for all three axes even after a successful survey reported values such as:

```
mean_x_m: 1051038.86
mean_y_m: 6124318.15
mean_z_m: 1433152.94
```

**Impact:** The "Local" coordinate display was completely non-functional. Users had no way to read the projected ECEF coordinates computed by the survey process.

---

## 3. Root Cause Analysis

All three bugs share a single underlying cause: **the backend survey response payload was partially consumed**. Only `active`, `accuracy_m`, and `progress_seconds` were ever read. The fields `valid`, `mean_x_m`, `mean_y_m`, `mean_z_m`, and `observations` were present in every API response but were silently discarded at both the WebSocket handler and the HTTP polling handler.

The backend response contract is:

```
GET /api/v1/survey  →  {
  active:           boolean,   ← was consumed
  valid:            boolean,   ← NOT consumed (BUG-002)
  progress_seconds: number,    ← was consumed
  accuracy_m:       number,    ← was consumed
  observations:     number,    ← NOT consumed (BUG-003)
  mean_x_m:         number,    ← NOT consumed (BUG-003)
  mean_y_m:         number,    ← NOT consumed (BUG-003)
  mean_z_m:         number     ← NOT consumed (BUG-003)
}
```

The correct completion signal from the backend is the **combination**:
```
active === false  AND  valid === true
```
The erroneous code only checked `active === false`, which is also true during a manual stop where `valid` remains `false`.

---

## 4. Erroneous Code (Before Fix)

### 4a. WebSocket handler — `if (prev.isActive)` branch

**File:** `src/context/GNSSContext.tsx`
**Approximate lines before fix:** 311–336

```ts
// ERRONEOUS — BUG-001, BUG-002, BUG-003
if (prev.isActive) {
  const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;
  return {
    ...prev,
    satelliteCount: data.gnss?.num_satellites ?? prev.satelliteCount,
    currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
    position: {
      latitude:  data.gnss?.latitude           ?? prev.position.latitude,
      longitude: data.gnss?.longitude          ?? prev.position.longitude,
      altitude:  data.gnss?.altitude_msl       ?? prev.position.altitude,
      accuracy:  data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
    },
    isActive: wsActive,
    // BUG-001: 'valid' field from backend never checked.
    //          Natural completion is indistinguishable from manual stop.
    status: !wsActive ? 'stopped' : prev.status,
    // BUG-002: survey.valid is never updated. Stays false forever.
    // BUG-003: localCoordinates never updated. Stays at zero forever.
  };
}
```

### 4b. HTTP poll handler — `setSurvey` callback

**File:** `src/context/GNSSContext.tsx`
**Approximate lines before fix:** 603–628

```ts
// ERRONEOUS — BUG-001, BUG-002, BUG-003
if (surveyStatus && !stoppingRef.current) {
  setSurvey((prev) => {
    if (prev.status === 'completed') return prev;

    const pollAccuracy = (surveyStatus.accuracy_m ?? 0) * 100;
    return {
      ...prev,
      elapsedTime:    surveyStatus.progress_seconds ?? prev.elapsedTime,
      currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
      // BUG-001: status is never set to 'completed' here — not even 'stopped'.
      //          The status field is untouched when active transitions to false.
      isActive: surveyStatus.active ?? prev.isActive,
      // BUG-002: survey.valid is never updated.
      // BUG-003: localCoordinates never updated.
    };
  });
}
```

---

## 5. Corrected Code (After Fix)

### 5a. WebSocket handler — `if (prev.isActive)` branch

**File:** `src/context/GNSSContext.tsx`
**Lines after fix:** 311–337

```ts
// CORRECTED
if (prev.isActive) {
  const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;

  // FIX BUG-002: read valid from backend payload
  const wsValid = data.survey?.valid ?? prev.valid;

  // FIX BUG-001: distinguish natural completion (active=false + valid=true)
  //              from manual stop (active=false + valid=false)
  const newStatus = !wsActive
    ? (wsValid ? 'completed' : 'stopped')
    : prev.status;

  return {
    ...prev,
    satelliteCount: data.gnss?.num_satellites ?? prev.satelliteCount,
    currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
    position: {
      latitude:  data.gnss?.latitude            ?? prev.position.latitude,
      longitude: data.gnss?.longitude           ?? prev.position.longitude,
      altitude:  data.gnss?.altitude_msl        ?? prev.position.altitude,
      accuracy:  data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
    },
    isActive: wsActive,
    valid:    wsValid,       // FIX BUG-002
    status:   newStatus,     // FIX BUG-001
    // FIX BUG-003: map backend ECEF fields to localCoordinates
    localCoordinates: {
      meanX:        data.survey?.mean_x_m    ?? prev.localCoordinates.meanX,
      meanY:        data.survey?.mean_y_m    ?? prev.localCoordinates.meanY,
      meanZ:        data.survey?.mean_z_m    ?? prev.localCoordinates.meanZ,
      observations: data.survey?.observations ?? prev.localCoordinates.observations,
    },
  };
}
```

### 5b. HTTP poll handler — `setSurvey` callback

**File:** `src/context/GNSSContext.tsx`
**Lines after fix:** 603–629

```ts
// CORRECTED
if (surveyStatus && !stoppingRef.current) {
  setSurvey((prev) => {
    if (prev.status === 'completed') return prev;

    const pollAccuracy  = (surveyStatus.accuracy_m ?? 0) * 100;

    // FIX BUG-002: read valid from poll response
    const isNowActive   = surveyStatus.active ?? prev.isActive;
    const pollValid     = surveyStatus.valid  ?? prev.valid;

    // FIX BUG-001: same completion detection logic as WebSocket path
    const newStatus = !isNowActive
      ? (pollValid ? 'completed' : 'stopped')
      : prev.status;

    return {
      ...prev,
      elapsedTime:     surveyStatus.progress_seconds ?? prev.elapsedTime,
      currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
      isActive:        isNowActive,
      valid:           pollValid,   // FIX BUG-002
      status:          newStatus,   // FIX BUG-001
      // FIX BUG-003: map backend ECEF fields to localCoordinates
      localCoordinates: {
        meanX:        surveyStatus.mean_x_m    ?? prev.localCoordinates.meanX,
        meanY:        surveyStatus.mean_y_m    ?? prev.localCoordinates.meanY,
        meanZ:        surveyStatus.mean_z_m    ?? prev.localCoordinates.meanZ,
        observations: surveyStatus.observations ?? prev.localCoordinates.observations,
      },
    };
  });
}
```

---

## 6. Backend vs. Frontend Behaviour Comparison

| Scenario | Backend Response | Before Fix (Frontend) | After Fix (Frontend) |
|---|---|---|---|
| Survey running | `active: true, valid: false` | `status: 'in-progress'` | `status: 'in-progress'` |
| Survey completed naturally | `active: false, valid: true` | `status: 'stopped'` ❌ | `status: 'completed'` ✅ |
| Survey stopped manually | `active: false, valid: false` | `status: 'stopped'` ✅ | `status: 'stopped'` ✅ |
| `survey.valid` field | `valid: true` after completion | Always `false` ❌ | Mirrors backend ✅ |
| Local coordinates (X/Y/Z) | Populated after survey | Always `NIL` ❌ | Populated ✅ |
| `observations` count | Populated after survey | Always `0` ❌ | Populated ✅ |

---

## 7. Data Flow Diagram

```
Raspberry Pi Backend  ──►  WebSocket (ws://192.168.1.33:8000/ws/status)
                      │         │
                      │         ▼
                      │    wsRef.current.onmessage
                      │         │
                      │         ▼
                      │    setSurvey(prev => {
                      │      wsActive  = data.survey?.active
                      │      wsValid   = data.survey?.valid        ← NEW (BUG-002 fix)
                      │      newStatus = !wsActive
                      │                  ? (wsValid ? 'completed'  ← NEW (BUG-001 fix)
                      │                            : 'stopped')
                      │                  : prev.status
                      │      localCoordinates = {                  ← NEW (BUG-003 fix)
                      │        meanX: data.survey?.mean_x_m
                      │        meanY: data.survey?.mean_y_m
                      │        meanZ: data.survey?.mean_z_m
                      │        observations: data.survey?.observations
                      │      }
                      │    })
                      │
                      └──►  GET /api/v1/survey  (polled every 2 s)
                                  │
                                  ▼
                             setSurvey(prev => {
                               isNowActive = surveyStatus.active
                               pollValid   = surveyStatus.valid    ← NEW (BUG-002 fix)
                               newStatus   = !isNowActive
                                             ? (pollValid ? 'completed'  ← NEW (BUG-001 fix)
                                                         : 'stopped')
                                             : prev.status
                               localCoordinates = {               ← NEW (BUG-003 fix)
                                 meanX: surveyStatus.mean_x_m
                                 meanY: surveyStatus.mean_y_m
                                 meanZ: surveyStatus.mean_z_m
                                 observations: surveyStatus.observations
                               }
                             })
```

---

## 8. Verification Checklist

Use the following steps to confirm all three bugs are resolved after deploying the fix:

**BUG-001 — Survey completion status**
- [ ] Start a survey from the application UI.
- [ ] Allow the survey to run until the backend naturally completes it (`active: false, valid: true`).
- [ ] Confirm the badge in the Survey Status card changes to **"Completed"** (green).
- [ ] Confirm the badge does NOT show "Stopped".
- [ ] Manually stop a survey mid-run and confirm the badge shows **"Stopped"** (red) — not "Completed".

**BUG-002 — `valid` field sync**
- [ ] Open browser DevTools → Console.
- [ ] After natural survey completion, confirm the log line `🔍 Survey Status Poll` shows `"valid": true` in the raw response.
- [ ] Confirm the React state (via React DevTools or console log) shows `survey.valid === true`.

**BUG-003 — Local coordinates display**
- [ ] After a survey completes, navigate to the **Position Information** card.
- [ ] Switch to the **"Local"** tab.
- [ ] Confirm the Mean X (Easting), Mean Y (Northing), and Mean Z (Height) fields show numeric values, not `NIL`.
- [ ] Confirm the values match the `mean_x_m`, `mean_y_m`, `mean_z_m` values visible in the browser console poll log.

---

*End of report.*
