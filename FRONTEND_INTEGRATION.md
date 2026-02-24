# GNSS Backend - Frontend Integration Guide

Complete API reference for integrating with the GNSS RTK Base Station backend.

---

## 🌐 Connection Information

**Base URL:** ``
**WebSocket:** `ws://192.168.1.33:8000/ws/status`
**API Documentation:** `http://192.168.1.33:8000/docs` (Interactive Swagger UI)
**Alternative Docs:** `http://192.168.1.33:8000/redoc`

**Server Features:**
- ✅ Auto-starts on boot
- ✅ Always available (no manual startup needed)
- ✅ CORS enabled (all origins allowed for local network)
- ✅ Real-time WebSocket updates (1.5s interval)

---

## 📚 API Reference

### Status Endpoints (GET - Read-Only)

#### 1. Health Check
**Endpoint:** `GET /api/v1/health`
**Purpose:** Check if the backend is running and GNSS device is connected

**Response:**
```json
{
  "status": "healthy",
  "gnss_connected": true,
  "uptime_seconds": 123.45,
  "version": "1.0.0-phase6"
}
```

---

#### 2. GNSS Position & Status
**Endpoint:** `GET /api/v1/status`
**Purpose:** Get current GNSS position, fix type, and accuracy

**Response:**
```json
{
  "connected": true,
  "fix_type": "RTK Fixed",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "altitude_msl": 10.5,
  "num_satellites": 14,
  "horizontal_accuracy": 0.014
}
```

**Fix Types:**
- `"No Fix"` - No GPS signal
- `"3D Fix"` - Standard GPS fix (~3-10m accuracy)
- `"RTK Float"` - RTK in progress (~0.3-1m accuracy)
- `"RTK Fixed"` - Full RTK accuracy (~1-2cm accuracy)

---

#### 3. Survey-In Status
**Endpoint:** `GET /api/v1/survey`
**Purpose:** Get Survey-In progress and base station position establishment status

**Response:**
```json
{
  "active": true,
  "valid": false,
  "progress_seconds": 85,
  "accuracy_m": 2.34,
  "observations": 142,
  "mean_x_m": 1234567.89,
  "mean_y_m": -987654.32,
  "mean_z_m": 6543210.12
}
```

**Fields:**
- `active` - Survey-In is currently running
- `valid` - Survey-In completed successfully (base position established)
- `progress_seconds` - Time elapsed since Survey-In started
- `accuracy_m` - Current position accuracy in meters
- `observations` - Number of valid satellite observations
- `mean_x_m`, `mean_y_m`, `mean_z_m` - Base station position in ECEF coordinates (meters)

---

#### 4. RTCM Correction Statistics
**Endpoint:** `GET /api/v1/rtcm`
**Purpose:** Get RTK correction generation statistics

**Response:**
```json
{
  "enabled": true,
  "total_messages": 1234,
  "total_bytes": 456789,
  "data_rate_bps": 423.5,
  "message_counts": {
    "1005": 12,
    "1077": 456,
    "1087": 445,
    "1097": 321
  },
  "elapsed_seconds": 120.5
}
```

**RTCM Message Types:**
- `1005` - Base station position
- `1077` - GPS MSM7 (full precision observations)
- `1087` - GLONASS MSM7
- `1097` - Galileo MSM7
- `1127` - BeiDou MSM7 (if enabled)

---

#### 5. NTRIP Streaming Status
**Endpoint:** `GET /api/v1/ntrip`
**Purpose:** Get NTRIP caster connection and streaming status

**Response:**
```json
{
  "enabled": true,
  "connected": true,
  "host": "caster.emlid.com",
  "port": 2101,
  "mountpoint": "YOUR_MOUNT",
  "bytes_sent": 123456,
  "uptime_seconds": 345.6
}
```

---

### Control Endpoints (POST - Actions)

#### 1. Start Survey-In
**Endpoint:** `POST /api/v1/survey/start`
**Purpose:** Start Survey-In mode to establish base station position

**Request Body:**
```json
{
  "min_duration_sec": 120,
  "accuracy_limit_m": 2.0
}
```

**Parameters:**
- `min_duration_sec` (10-3600) - Minimum observation time in seconds
- `accuracy_limit_m` (0-100) - Target accuracy in meters

**Response:**
```json
{
  "success": true,
  "message": "Survey-In started: 120s, 2.0m"
}
```

**Recommended Settings:**
- **Quick test:** 60s, 5m accuracy
- **Standard:** 120s, 2m accuracy (default)
- **High precision:** 300s, 1m accuracy

---

#### 2. Stop Survey-In
**Endpoint:** `POST /api/v1/survey/stop`
**Purpose:** Stop active Survey-In session

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Survey-In stopped"
}
```

---

#### 3. Configure RTCM Output
**Endpoint:** `POST /api/v1/rtcm/configure`
**Purpose:** Enable RTCM correction generation

**Request Body:**
```json
{
  "enable_beidou": true
}
```

**Parameters:**
- `enable_beidou` (boolean) - Include BeiDou satellite system

**Response:**
```json
{
  "success": true,
  "message": "RTCM output configured (BeiDou: true)"
}
```

**Note:** Must be called before starting NTRIP streaming

---

#### 4. Start NTRIP Streaming
**Endpoint:** `POST /api/v1/ntrip/start`
**Purpose:** Start streaming RTK corrections to NTRIP caster

**Request Body:**
```json
{
  "host": "caster.emlid.com",
  "port": 2101,
  "mountpoint": "YOUR_MOUNTPOINT",
  "password": "YOUR_PASSWORD",
  "username": null
}
```

**Parameters:**
- `host` (string) - NTRIP caster hostname
- `port` (1-65535) - NTRIP caster port
- `mountpoint` (string) - Your mountpoint name
- `password` (string) - Your password
- `username` (string or null) - Username (use `null` for Emlid base)

**Response:**
```json
{
  "success": true,
  "message": "NTRIP streaming started: caster.emlid.com:2101/YOUR_MOUNTPOINT"
}
```

**Prerequisites:**
- RTCM output must be configured first
- Survey-In should be completed for accurate base position

---

#### 5. Stop NTRIP Streaming
**Endpoint:** `POST /api/v1/ntrip/stop`
**Purpose:** Stop NTRIP caster streaming

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "NTRIP streaming stopped"
}
```

---

## 🔌 WebSocket Real-Time Updates

### Connection

**URL:** `ws://192.168.1.33:8000/ws/status`
**Protocol:** WebSocket
**Update Frequency:** Every 1.5 seconds
**Auto-reconnect:** Recommended

### Message Format

All WebSocket messages follow this structure:

```json
{
  "type": "status_update",
  "timestamp": 1707934567.89,
  "gnss": {
    "connected": true,
    "fix_type": "RTK Fixed",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude_msl": 10.5,
    "num_satellites": 14,
    "horizontal_accuracy": 0.014
  },
  "survey": {
    "active": true,
    "valid": false,
    "progress_seconds": 85,
    "accuracy_m": 2.34,
    "observations": 142,
    "mean_x_m": 1234567.89,
    "mean_y_m": -987654.32,
    "mean_z_m": 6543210.12
  },
  "rtcm": {
    "enabled": true,
    "total_messages": 1234,
    "total_bytes": 456789,
    "data_rate_bps": 423.5,
    "message_counts": {
      "1005": 12,
      "1077": 456,
      "1087": 445,
      "1097": 321
    }
  },
  "ntrip": {
    "enabled": true,
    "connected": true,
    "host": "caster.emlid.com",
    "port": 2101,
    "mountpoint": "YOUR_MOUNT",
    "bytes_sent": 123456,
    "uptime_seconds": 345.6
  }
}
```

**Benefits:**
- Single connection for all status updates
- Automatic updates every 1.5 seconds
- No polling needed
- Battery efficient for mobile apps

---

## 💻 Code Examples

### JavaScript / React Native

```javascript
// ============================================================
// API Configuration
// ============================================================
const API_BASE = 'http://192.168.1.33:8000';
const WS_URL = 'ws://192.168.1.33:8000/ws/status';

// ============================================================
// WebSocket Hook for Real-Time Updates
// ============================================================
import { useState, useEffect } from 'react';

export const useGNSSStatus = () => {
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket Disconnected');
      setConnected(false);
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        console.log('🔄 Reconnecting...');
      }, 3000);
    };

    return () => ws.close();
  }, []);

  return { status, connected };
};

// ============================================================
// API Helper Functions
// ============================================================
export const api = {
  // ------------------------------------------------------------
  // Status Endpoints (GET)
  // ------------------------------------------------------------
  getHealth: async () => {
    const response = await fetch(`${API_BASE}/api/v1/health`);
    return response.json();
  },

  getGNSSStatus: async () => {
    const response = await fetch(`${API_BASE}/api/v1/status`);
    return response.json();
  },

  getSurveyStatus: async () => {
    const response = await fetch(`${API_BASE}/api/v1/survey`);
    return response.json();
  },

  getRTCMStatus: async () => {
    const response = await fetch(`${API_BASE}/api/v1/rtcm`);
    return response.json();
  },

  getNTRIPStatus: async () => {
    const response = await fetch(`${API_BASE}/api/v1/ntrip`);
    return response.json();
  },

  // ------------------------------------------------------------
  // Survey-In Control
  // ------------------------------------------------------------
  startSurvey: async (duration = 120, accuracy = 2.0) => {
    const response = await fetch(`${API_BASE}/api/v1/survey/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        min_duration_sec: duration,
        accuracy_limit_m: accuracy
      })
    });
    return response.json();
  },

  stopSurvey: async () => {
    const response = await fetch(`${API_BASE}/api/v1/survey/stop`, {
      method: 'POST'
    });
    return response.json();
  },

  // ------------------------------------------------------------
  // RTCM Configuration
  // ------------------------------------------------------------
  configureRTCM: async (enableBeidou = true) => {
    const response = await fetch(`${API_BASE}/api/v1/rtcm/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable_beidou: enableBeidou })
    });
    return response.json();
  },

  // ------------------------------------------------------------
  // NTRIP Streaming Control
  // ------------------------------------------------------------
  startNTRIP: async (host, port, mountpoint, password, username = null) => {
    const response = await fetch(`${API_BASE}/api/v1/ntrip/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        port,
        mountpoint,
        password,
        username
      })
    });
    return response.json();
  },

  stopNTRIP: async () => {
    const response = await fetch(`${API_BASE}/api/v1/ntrip/stop`, {
      method: 'POST'
    });
    return response.json();
  }
};

// ============================================================
// Example React Component
// ============================================================
function GNSSMonitor() {
  const { status, connected } = useGNSSStatus();

  // Survey-In Control
  const handleStartSurvey = async () => {
    try {
      const result = await api.startSurvey(120, 2.0);
      console.log('✅ Survey started:', result.message);
    } catch (error) {
      console.error('❌ Error starting survey:', error);
    }
  };

  const handleStopSurvey = async () => {
    try {
      const result = await api.stopSurvey();
      console.log('✅ Survey stopped:', result.message);
    } catch (error) {
      console.error('❌ Error stopping survey:', error);
    }
  };

  // RTCM Configuration
  const handleConfigureRTCM = async () => {
    try {
      const result = await api.configureRTCM(true);
      console.log('✅ RTCM configured:', result.message);
    } catch (error) {
      console.error('❌ Error configuring RTCM:', error);
    }
  };

  // NTRIP Control
  const handleStartNTRIP = async () => {
    try {
      const result = await api.startNTRIP(
        'caster.emlid.com',
        2101,
        'YOUR_MOUNTPOINT',
        'YOUR_PASSWORD',
        null  // No username for Emlid
      );
      console.log('✅ NTRIP started:', result.message);
    } catch (error) {
      console.error('❌ Error starting NTRIP:', error);
    }
  };

  const handleStopNTRIP = async () => {
    try {
      const result = await api.stopNTRIP();
      console.log('✅ NTRIP stopped:', result.message);
    } catch (error) {
      console.error('❌ Error stopping NTRIP:', error);
    }
  };

  // Loading state
  if (!status) {
    return <div>Connecting to GNSS Backend...</div>;
  }

  // Render UI
  return (
    <div>
      <h2>GNSS Status</h2>
      <p>Connection: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
      <p>Fix Type: {status.gnss.fix_type}</p>
      <p>Satellites: {status.gnss.num_satellites}</p>
      <p>Accuracy: {status.gnss.horizontal_accuracy.toFixed(3)}m</p>
      <p>Position: {status.gnss.latitude.toFixed(6)}, {status.gnss.longitude.toFixed(6)}</p>

      {/* Survey-In Section */}
      {status.survey.active && (
        <div>
          <h3>Survey-In Progress</h3>
          <p>Time: {status.survey.progress_seconds}s</p>
          <p>Accuracy: {status.survey.accuracy_m.toFixed(2)}m</p>
          <p>Observations: {status.survey.observations}</p>
          <p>Status: {status.survey.valid ? '✅ Valid' : '⏳ In Progress'}</p>
          <button onClick={handleStopSurvey}>Stop Survey-In</button>
        </div>
      )}

      {!status.survey.active && (
        <button onClick={handleStartSurvey}>Start Survey-In (120s, 2m)</button>
      )}

      {/* RTCM Section */}
      <div>
        <h3>RTCM Corrections</h3>
        <p>Enabled: {status.rtcm.enabled ? '✅' : '❌'}</p>
        {status.rtcm.enabled && (
          <>
            <p>Messages: {status.rtcm.total_messages}</p>
            <p>Data Rate: {status.rtcm.data_rate_bps.toFixed(1)} B/s</p>
          </>
        )}
        {!status.rtcm.enabled && (
          <button onClick={handleConfigureRTCM}>Configure RTCM</button>
        )}
      </div>

      {/* NTRIP Section */}
      <div>
        <h3>NTRIP Streaming</h3>
        <p>Enabled: {status.ntrip.enabled ? '✅' : '❌'}</p>
        {status.ntrip.enabled && (
          <>
            <p>Connected: {status.ntrip.connected ? '✅' : '❌'}</p>
            <p>Bytes Sent: {status.ntrip.bytes_sent.toLocaleString()}</p>
            <button onClick={handleStopNTRIP}>Stop NTRIP</button>
          </>
        )}
        {!status.ntrip.enabled && (
          <button onClick={handleStartNTRIP}>Start NTRIP</button>
        )}
      </div>
    </div>
  );
}

export default GNSSMonitor;
```

---

## 🚀 Quick Start Workflow

### Typical Base Station Setup Sequence:

1. **Check Health**
   ```javascript
   const health = await api.getHealth();
   // Verify gnss_connected is true
   ```

2. **Start Survey-In** (establish base position)
   ```javascript
   await api.startSurvey(120, 2.0);
   // Monitor via WebSocket until valid = true
   ```

3. **Configure RTCM** (enable corrections)
   ```javascript
   await api.configureRTCM(true);
   ```

4. **Start NTRIP** (stream corrections)
   ```javascript
   await api.startNTRIP(
     'caster.emlid.com',
     2101,
     'YOUR_MOUNTPOINT',
     'YOUR_PASSWORD'
   );
   ```

5. **Monitor via WebSocket**
   - Real-time position updates
   - Survey-In progress
   - RTCM generation stats
   - NTRIP connection status

---

## ⚠️ Error Handling

### HTTP Status Codes

- **200 OK** - Success
- **400 Bad Request** - Invalid parameters (check request body)
- **500 Internal Server Error** - Operation failed (check backend logs)
- **503 Service Unavailable** - GNSS device not connected

### Common Error Scenarios

**NTRIP start fails with 400:**
- RTCM output not configured yet
- Solution: Call `/api/v1/rtcm/configure` first

**Survey-In start fails with 503:**
- GNSS device not connected
- Solution: Check hardware connection, restart backend

**WebSocket disconnects:**
- Network issue or backend restart
- Solution: Implement auto-reconnect (see code example)

---

## 📝 Notes

- **Network:** Backend is accessible only on local network (192.168.1.x)
- **Security:** No authentication (local network only)
- **Persistence:** Service auto-starts on boot, no manual startup needed
- **Logs:** Backend logs all API calls and WebSocket activity
- **Documentation:** Interactive API docs available at `/docs`

---

## 🐛 Debugging

**View backend logs:**
```bash
# SSH into Raspberry Pi
ssh dyx-robotics@192.168.1.33

# View live logs
tail -f /home/dyx-robotics/gnss_backend/logs/gnss_backend.log
```

**Test endpoints:**
- Open `http://192.168.1.33:8000/docs` in browser
- Interactive Swagger UI for testing all endpoints

---

## 📞 Support

- **Backend Version:** 1.0.0-phase6
- **API Base:** http://192.168.1.33:8000
- **Documentation:** http://192.168.1.33:8000/docs

---

**Last Updated:** February 2026
**Backend Status:** ✅ Ready for Production
