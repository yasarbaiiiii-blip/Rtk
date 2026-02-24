# GNSS Backend - Quick API Reference

## 🔗 URLs
- **Base:** `http://192.168.1.33:8000`
- **WebSocket:** `ws://192.168.1.33:8000/ws/status`
- **Docs:** `http://192.168.1.33:8000/docs`

---

## 📡 GET Endpoints (Status)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | Health check |
| `GET /api/v1/status` | GNSS position & satellites |
| `GET /api/v1/survey` | Survey-In progress |
| `GET /api/v1/rtcm` | RTCM statistics |
| `GET /api/v1/ntrip` | NTRIP status |

---

## 🎛️ POST Endpoints (Control)

| Endpoint | Purpose | Body |
|----------|---------|------|
| `POST /api/v1/survey/start` | Start Survey-In | `{"min_duration_sec": 120, "accuracy_limit_m": 2.0}` |
| `POST /api/v1/survey/stop` | Stop Survey-In | None |
| `POST /api/v1/rtcm/configure` | Enable RTCM | `{"enable_beidou": true}` |
| `POST /api/v1/ntrip/start` | Start NTRIP | `{"host": "...", "port": 2101, "mountpoint": "...", "password": "..."}` |
| `POST /api/v1/ntrip/stop` | Stop NTRIP | None |

---

## 🔌 WebSocket

**URL:** `ws://192.168.1.33:8000/ws/status`
**Updates:** Every 1.5 seconds
**Data:** Complete status (GNSS + Survey + RTCM + NTRIP)

---

## 🚀 Quick Setup Workflow

```javascript
// 1. Start Survey-In (establish base position)
await fetch('http://192.168.1.33:8000/api/v1/survey/start', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({min_duration_sec: 120, accuracy_limit_m: 2.0})
});

// 2. Configure RTCM (enable corrections)
await fetch('http://192.168.1.33:8000/api/v1/rtcm/configure', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({enable_beidou: true})
});

// 3. Start NTRIP (stream corrections)
await fetch('http://192.168.1.33:8000/api/v1/ntrip/start', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    host: 'caster.emlid.com',
    port: 2101,
    mountpoint: 'MP23960',
    password: '953ztv'
  })
});


// 4. Connect WebSocket for real-time updates
const ws = new WebSocket('ws://192.168.1.33:8000/ws/status');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.gnss, data.survey, data.rtcm, data.ntrip);
};
```

---

## 📊 Fix Types

- `"No Fix"` - No GPS (~0 sats)
- `"3D Fix"` - Standard GPS (3-10m)
- `"RTK Float"` - RTK initializing (0.3-1m)
- `"RTK Fixed"` - Full RTK (1-2cm) ⭐

---

**Full Documentation:** [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
