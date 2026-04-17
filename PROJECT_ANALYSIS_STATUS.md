# Base Station Frontend Project Analysis

Last updated: 2026-04-17
Repository: `d:\Base_Station_Frontend`

## 1. Executive Summary

This frontend is a React + Vite + Capacitor application for operating a GNSS base station from mobile/web UI.

The current app already covers:

- device discovery and connection over WebSocket
- health-based network discovery
- live GNSS/survey/NTRIP state handling
- AutoFlow-based survey start/stop flow
- AutoFlow configuration save/load
- RTCM mode configuration
- fixed-base position apply
- NTRIP sender start/stop
- history/log viewing and export/share helpers

The current app does **not** yet cover several newer backend endpoints from the provided list, especially:

- direct GNSS command execution
- direct survey start/stop endpoints
- LoRa endpoints
- reader status/reconnect endpoints
- receiver reset/status endpoints
- base saved-position and resurvey decision endpoints
- root/info/alias endpoints

Important finding:

- The frontend currently mixes **newer endpoints** such as `/api/v1/status/position`, `/api/v1/status/survey`, `/api/v1/status/base-reference`, `/api/v1/autoflow/*`, `/api/v1/base/fixed`
- with **legacy endpoints** such as `/api/v1/survey`, `/api/v1/rtcm`, `/api/v1/ntrip`

So for the team, the app is **partially aligned** with the backend contract you shared, but not fully.

---

## 2. High-Level Architecture

## Core stack

- React + TypeScript + Vite
- Capacitor for Android/iOS shell
- Capacitor Wi-Fi and BLE plugins for native device/network access
- WebSocket for live hardware status stream
- HTTP REST calls for configuration, polling, and control operations

## Main runtime files

- `src/main.tsx`
  - app bootstrap and native status bar setup
- `src/app/App.tsx`
  - top-level navigation and screen switching
- `src/context/GNSSContext.tsx`
  - main app brain; owns connection, polling, logs, survey lifecycle, NTRIP, AutoFlow, fixed-base state
- `src/api/gnssApiDynamic.ts`
  - all backend REST calls; API base is derived from the selected WebSocket host

## UI screens

- `ConnectionScreen`
  - finds device and starts session
- `DashboardScreen`
  - main live survey dashboard
- `ConfigurationScreen`
  - AutoFlow, RTCM, NTRIP sender, fixed-base and local config
- `HistoryScreen`
  - survey/log history, delete/export/share
- `SettingsScreen`
  - local app preferences only

## Native helpers

- `src/native/wifi.ts`
  - Wi-Fi permission, scan, current SSID/IP, connect
- `src/native/ble.ts`
  - BLE scan/connect support exists in code

## Utility helpers

- `src/utils/ipDiscovery.ts`
  - subnet scanning using `GET /api/v1/health`
- `src/utils/backendLogger.ts`
  - dev/debug interceptor for fetch calls
- `src/utils/uiLogger.ts`
  - optional local terminal logger on `localhost:3001`

---

## 3. Real Application Flow

## 3.1 App startup

1. `src/main.tsx` loads translations, styles, and the main app.
2. `src/app/App.tsx` wraps the UI with `GNSSProvider`.
3. `GNSSContext` hydrates saved local state from `localStorage`.

## 3.2 Connection flow

1. User lands on `ConnectionScreen`.
2. For Wi-Fi discovery:
   - current Wi-Fi info is read from native helper
   - subnet scan is performed by `deepSweepNetwork()`
   - each candidate IP is checked using `GET /api/v1/health`
3. When a WebSocket URL is chosen:
   - `connectToDevice()` is called
   - API host is derived from the WS host by `setApiHost()`
   - WebSocket is opened via `connectWebSocket()`
4. On WebSocket open:
   - connection state becomes active
   - latest AutoFlow config is pulled from backend
   - working WS URL is stored for reconnect

## 3.3 Live runtime flow

WebSocket is the live telemetry backbone.

`GNSSContext` updates from WS:

- GNSS fix and satellites
- position snapshots
- survey progress

REST polling is also used in parallel:

- survey status polling from `/api/v1/status/survey`
- position polling from `/api/v1/status/position`
- NTRIP polling from legacy `/api/v1/ntrip`
- AutoFlow runtime polling from `/api/v1/autoflow/status`

## 3.4 Survey flow in current frontend

The current UI label says "survey", but the real implementation is **AutoFlow-driven**, not direct survey endpoint driven.

Start:

1. Dashboard Start button calls `startSurvey()`
2. `startSurvey()` in `GNSSContext` builds AutoFlow payload
3. It calls `POST /api/v1/autoflow/start`
4. UI enters `initializing`
5. WS + survey polling move UI to active/completed/failed states

Stop:

1. Dashboard Stop button calls `stopSurvey()`
2. `stopSurvey()` calls `POST /api/v1/autoflow/stop`
3. If NTRIP is active, it also stops NTRIP
4. Survey state is finalized locally and stored in history

So:

- direct survey endpoints are not used
- AutoFlow endpoints are the active survey control path

## 3.5 Configuration flow

`ConfigurationScreen` handles:

- loading RTCM status on mount
- saving AutoFlow config
- manually starting/stopping AutoFlow
- RTCM mode switching
- fixed-base coordinate apply
- NTRIP sender start/stop

## 3.6 History and settings flow

- `HistoryScreen` is local-data focused
  - survey history comes from context state
  - logs come from context state
  - export/share is local
- `SettingsScreen` only updates local app preferences
  - no backend endpoint usage

---

## 4. Project Structure Summary

## App code

- `src/app`
  - screens and reusable UI components
- `src/context`
  - application state and flow orchestration
- `src/api`
  - backend HTTP client
- `src/types`
  - app domain types
- `src/utils`
  - logging, discovery, CSV/share/theme helpers
- `src/native`
  - Capacitor-native Wi-Fi/BLE bridge
- `src/i18n`
  - language files
- `src/styles`
  - CSS/theme files

## Platform wrappers

- `android/`
- `ios/`

These show the app is intended for mobile deployment, not only browser use.

## Docs and scripts

- `FRONTEND_INTEGRATION.md`
- `API_QUICK_REFERENCE.md`
- `scripts/*`

These are useful references, but they are **not always fully in sync** with current runtime code.

---

## 5. Endpoint Usage Audit

Status meanings used below:

- `Used in main app`
- `Used in dev/debug only`
- `Defined but not called`
- `Not used`
- `Legacy endpoint used instead`

## 5.1 Endpoints from your provided list

| Endpoint | Status | Where used | Why used / Note |
|---|---|---|---|
| `GET /api/v1/status` | Used in dev/debug only | `src/utils/backendLogger.ts` | Debug panel test call only; main UI does not rely on it |
| `GET /api/v1/status/position` | Used in main app | `src/context/GNSSContext.tsx` | Polls live latitude/longitude/altitude/accuracy/satellite count for dashboard and state sync |
| `GET /api/v1/status/survey` | Used in main app | `src/context/GNSSContext.tsx` | Polls survey progress, activity, elapsed time, accuracy, validity |
| `GET /api/v1/status/base-reference` | Used in main app | `src/context/GNSSContext.tsx` | Fetches and confirms fixed-base reference after fixed position apply |
| `GET /api/v1/status/rtcm` | Not used | None | Frontend still uses legacy `/api/v1/rtcm` instead |
| `GET /api/v1/status/ntrip` | Not used | None | Frontend still uses legacy `/api/v1/ntrip` instead |
| `GET /api/v1/status/receiver` | Not used | None | No receiver-status UI implemented |
| `POST /api/v1/command` | Not used | None | No generic GNSS command UI implemented |
| `POST /api/v1/survey/start` | Not used | None | Survey start is currently done through `POST /api/v1/autoflow/start` |
| `POST /api/v1/survey/stop` | Not used | None | Survey stop is currently done through `POST /api/v1/autoflow/stop` |
| `POST /api/v1/rtcm/configure` | Used in main app | `src/api/gnssApiDynamic.ts`, `src/app/components/ConfigurationScreen.tsx` | Switches RTCM MSM type from config screen |
| `POST /api/v1/mode/base` | Not used | None | No explicit base mode switch call wired |
| `POST /api/v1/base/fixed` | Used in main app | `src/context/GNSSContext.tsx` | Applies operator-entered fixed base coordinates |
| `GET /api/v1/reader/status` | Not used | None | Reader-thread management not implemented in UI |
| `POST /api/v1/reader/reconnect` | Not used | None | Reader reconnect not implemented in UI |
| `GET /api/v1/autoflow/status` | Used in main app | `src/context/GNSSContext.tsx` | Polls AutoFlow runtime state to keep UI status stable |
| `GET /api/v1/autoflow/config` | Used in main app | `src/context/GNSSContext.tsx`, `src/app/components/ConfigurationScreen.tsx` | Loads/syncs saved backend AutoFlow config |
| `POST /api/v1/autoflow/config` | Used in main app | `src/app/components/ConfigurationScreen.tsx` | Saves AutoFlow config and backend NTRIP/accuracy/duration settings |
| `POST /api/v1/autoflow/start` | Used in main app | `src/context/GNSSContext.tsx`, `src/app/components/ConfigurationScreen.tsx` | Current start path for survey workflow |
| `POST /api/v1/autoflow/stop` | Used in main app | `src/context/GNSSContext.tsx`, `src/app/components/ConfigurationScreen.tsx` | Current stop path for survey workflow |
| `POST /api/v1/autoflow/enable` | Defined but not called | `src/api/gnssApiDynamic.ts` | API wrapper exists, but no active caller |
| `POST /api/v1/autoflow/disable` | Defined but not called | `src/api/gnssApiDynamic.ts` | API wrapper exists, but no active caller |
| `POST /api/v1/receiver/reset` | Not used | None | Reset UI/control not implemented |
| `GET /api/v1/health` | Used in main app and dev/debug | `src/utils/ipDiscovery.ts`, `src/api/gnssApiDynamic.ts`, `src/utils/backendLogger.ts` | Main usage is device discovery; debug tool also tests it |
| `GET /api/v1/base/saved-position` | Not used | None | Saved-position flow not implemented |
| `DELETE /api/v1/base/saved-position` | Not used | None | Saved-position deletion flow not implemented |
| `POST /api/v1/base/confirm-resurvey` | Not used | None | Resurvey decision flow not implemented |
| `POST /api/v1/base/skip-resurvey` | Not used | None | Resurvey decision flow not implemented |
| `POST /api/v1/ntrip/start` | Used in main app | `src/context/GNSSContext.tsx`, `src/app/components/ConfigurationScreen.tsx` | Starts NTRIP sender stream |
| `POST /api/v1/ntrip/stop` | Used in main app | `src/context/GNSSContext.tsx`, `src/app/components/ConfigurationScreen.tsx` | Stops NTRIP sender stream |
| `POST /api/v1/lora/start` | Not used | None | No LoRa UI/integration |
| `POST /api/v1/lora/stop` | Not used | None | No LoRa UI/integration |
| `GET /api/v1/lora/status` | Not used | None | No LoRa status integration |
| `GET /api/v1/status/lora` | Not used | None | No LoRa alias integration |
| `GET /health` | Not used | None | Frontend uses `/api/v1/health` instead |
| `GET /` | Not used | None | No root endpoint usage |
| `GET /info` | Not used | None | No info page usage |
| `GET /survey` | Not used | None | Frontend uses `/api/v1/survey` legacy endpoint, not `/survey` |
| `GET /rtcm` | Not used | None | Frontend uses `/api/v1/rtcm` legacy endpoint, not `/rtcm` |
| `GET /ntrip` | Not used | None | Frontend uses `/api/v1/ntrip` legacy endpoint, not `/ntrip` |

## 5.2 Legacy endpoints currently used by the frontend

These endpoints are **not in the new list you shared**, but they are present in current code:

| Legacy endpoint | Status | Where used | Comment |
|---|---|---|---|
| `GET /api/v1/survey` | Used in dev/debug only | `src/utils/backendLogger.ts` | Debug tool test call only |
| `GET /api/v1/rtcm` | Used in main app | `src/app/components/ConfigurationScreen.tsx` | Reads RTCM message counts and current MSM mode |
| `GET /api/v1/ntrip` | Used in main app | `src/context/GNSSContext.tsx` | Used for NTRIP status polling and confirmation waits |

## 5.3 Practical interpretation

Completed and actively wired:

- position status
- survey status
- base reference status
- AutoFlow config/status/start/stop
- RTCM configure
- fixed base apply
- NTRIP start/stop
- health-based discovery

Not yet wired:

- LoRa
- reader controls
- receiver controls
- base saved-position and resurvey actions
- direct GNSS command endpoint
- new status aliases for RTCM/NTRIP/receiver
- root/info/alias endpoints

Partially wired / needs cleanup:

- `/api/v1/autoflow/enable` and `/api/v1/autoflow/disable` wrappers exist but are unused
- frontend still depends on legacy `/api/v1/rtcm` and `/api/v1/ntrip`
- dashboard "survey" flow is actually AutoFlow flow

---

## 6. Why the Used Endpoints Are Used

## `GET /api/v1/health`

Used to detect whether a GNSS node exists on an IP during Wi-Fi subnet scan.

## `GET /api/v1/status/position`

Used to keep dashboard position, fix type, satellites, and accuracy updated every 2 seconds.

## `GET /api/v1/status/survey`

Used to keep survey lifecycle reliable even if WebSocket messages lag or briefly miss state transitions.

## `GET /api/v1/status/base-reference`

Used immediately after fixed-base apply so the UI can confirm and display the actual stored base reference.

## `GET /api/v1/autoflow/config`

Used after connection and after save to align frontend config with backend persisted values.

## `POST /api/v1/autoflow/config`

Used when saving configuration from the Configuration screen.

## `GET /api/v1/autoflow/status`

Used because runtime AutoFlow status is treated as the authoritative state for whether the automated flow is running.

## `POST /api/v1/autoflow/start`

Used as the current "start survey" implementation.

## `POST /api/v1/autoflow/stop`

Used as the current "stop survey" implementation.

## `POST /api/v1/rtcm/configure`

Used to switch between MSM4 and MSM7 from the UI.

## `POST /api/v1/base/fixed`

Used to apply a fixed LLH reference from operator-entered or current GNSS coordinates.

## `POST /api/v1/ntrip/start`

Used to start NTRIP sender broadcasting with host/port/mountpoint/credentials from config.

## `POST /api/v1/ntrip/stop`

Used to stop the NTRIP sender cleanly.

## Legacy `GET /api/v1/rtcm`

Used to populate RTCM current message state in the Configuration screen.

## Legacy `GET /api/v1/ntrip`

Used to confirm NTRIP sender connection and to update live NTRIP metrics in the dashboard/context.

---

## 7. Completed Work vs Pending Work

## Finished / already present

- app shell for Android/iOS/web
- connection/discovery UX
- WS-based live telemetry session
- persisted local settings and runtime state
- survey dashboard UI
- AutoFlow-backed start/stop workflow
- AutoFlow config save/load
- RTCM mode switch
- fixed base apply flow
- NTRIP sender controls
- survey history and log history screens
- local export/share for history/logs
- translation setup for English/Tamil/Hindi
- debug endpoint/logger tooling

## Pending or incomplete

- switch remaining legacy endpoints to new backend contract
- implement direct support if backend now expects:
  - `/api/v1/status/rtcm`
  - `/api/v1/status/ntrip`
  - `/api/v1/status/receiver`
- implement direct survey start/stop endpoints if AutoFlow is no longer the desired control path
- implement LoRa controls and status
- implement reader status/reconnect
- implement receiver reset/status
- implement base saved-position and resurvey flows
- implement GNSS command execution UI if required
- use `/api/v1/autoflow/enable` and `/api/v1/autoflow/disable` or remove wrappers
- finish stream control functions beyond NTRIP
- finish context export helpers:
  - `exportHistoryCSV`
  - `exportLogsCSV`
- connect the "receiver" panel in `ConfigurationScreen` to real backend calls
  - currently it is local mock state only
- decide whether BLE should remain supported
  - native BLE helpers exist, but current connection UI exposes Wi-Fi/auto only

---

## 8. Additional Findings for Team Discussion

## A. Survey naming mismatch

In the UI, users think they are starting a survey.
In the code, pressing Start actually calls AutoFlow start.

This is okay if intended, but the backend/API naming should be aligned so the team is not confused.

## B. API contract mismatch

The frontend is partly updated to the newer API but still depends on old endpoints for RTCM and NTRIP status.

This is the biggest integration risk right now.

## C. Some code paths exist only as wrappers

Examples:

- `enableAutoFlow()`
- `disableAutoFlow()`

These exist in the API client but are not actually called anywhere in the app flow.

## D. Some features are present in UI/state but not backend-integrated

Examples:

- NTRIP receiver panel in configuration
- generic stream toggling
- export methods in context

---

## 9. Key Source References

- App entry: `src/main.tsx`
- Main navigation shell: `src/app/App.tsx`
- Main state manager: `src/context/GNSSContext.tsx`
- API client: `src/api/gnssApiDynamic.ts`
- Connection screen: `src/app/components/ConnectionScreen.tsx`
- Dashboard survey screen: `src/app/components/dashboard/SurveyStatus.tsx`
- Configuration screen: `src/app/components/ConfigurationScreen.tsx`
- History screen: `src/app/components/HistoryScreen.tsx`
- Settings screen: `src/app/components/SettingsScreen.tsx`
- IP discovery: `src/utils/ipDiscovery.ts`
- Backend debug logger: `src/utils/backendLogger.ts`

---

## 10. Final Team Handoff Summary

If the team wants to mark work as finished vs pending, the safest summary is:

- **Finished**: connection, live dashboard, AutoFlow control/config, fixed base apply, RTCM configure, NTRIP sender, local history/logging
- **Pending**: full adoption of new backend endpoint set, LoRa, receiver/reader/base saved-position flows, command/reset flows, cleanup of legacy endpoint dependence

Most important next action:

1. Confirm whether the backend should keep supporting legacy `/api/v1/rtcm` and `/api/v1/ntrip`
2. If not, migrate frontend to `/api/v1/status/rtcm` and `/api/v1/status/ntrip`
3. Decide whether survey should remain AutoFlow-driven or move to direct `/api/v1/survey/start` and `/api/v1/survey/stop`

