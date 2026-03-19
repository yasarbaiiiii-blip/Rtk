// /* =========================================
//    GNSS Backend API Layer
//    ========================================= */

// const API_BASE = "http://192.168.1.33:8000";
// const isSecure = window.location.protocol === "https:";
// const WS_PROTOCOL = isSecure ? "wss" : "ws";

// export const WS_URL = `${WS_PROTOCOL}://192.168.1.33:8000/ws/status`;

// const handleResponse = async (response: Response) => {
//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
//   }
//   const responseData = await response.json();

//   // Log API responses
//   console.log(`📥 API Response [${response.status}] ${response.url}:`, responseData);

//   return responseData;
// };

// export const api = {
//   getHealth: async () => fetch(`${API_BASE}/api/v1/health`).then(handleResponse),
//   getStatus: async () => fetch(`${API_BASE}/api/v1/status`).then(handleResponse),
//   getSurvey: async () => fetch(`${API_BASE}/api/v1/survey`).then(handleResponse),
//   getSurveyStatus: async () => {
//     const res = await fetch(`${API_BASE}/api/v1/survey`);
//     const data = await res.json();
//     console.log(`📥 API Response [${res.status}] ${res.url}:`, data);
//     return data;
//   },
//   getRTCM: async () => fetch(`${API_BASE}/api/v1/rtcm`).then(handleResponse),
//   getNTRIP: async () => fetch(`${API_BASE}/api/v1/ntrip`).then(handleResponse),

//   startSurvey: async (minDurationSec: number, accuracyLimitM: number) => {
//     const requestBody = { min_duration_sec: minDurationSec, accuracy_limit_m: accuracyLimitM };
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/survey/start:`, requestBody);

//     return fetch(`${API_BASE}/api/v1/survey/start`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(requestBody),
//     }).then(handleResponse);
//   },

//   stopSurvey: async () => {
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/survey/stop:`, {});

//     return fetch(`${API_BASE}/api/v1/survey/stop`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     }).then(handleResponse);
//   },

//   getAutoFlowConfig: async () => fetch(`${API_BASE}/api/v1/autoflow/config`).then(handleResponse),

//   enableAutoFlow: async (config: {
//     msm_type: string;
//     min_duration_sec: number;
//     accuracy_limit_m: number;
//     ntrip_host: string;
//     ntrip_port: number;
//     ntrip_mountpoint: string;
//     ntrip_password: string;
//     ntrip_username: string;
//   }) => {
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/autoflow/enable:`, config);
//     return fetch(`${API_BASE}/api/v1/autoflow/enable`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(config),
//     }).then(handleResponse);
//   },

//   disableAutoFlow: async () => {
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/autoflow/disable`);
//     return fetch(`${API_BASE}/api/v1/autoflow/disable`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     }).then(handleResponse);
//   },

//   configureRTCM: async (msmType: 'MSM4' | 'MSM7') => {
//     const requestBody = { msm_type: msmType };
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/rtcm/configure:`, requestBody);

//     return fetch(`${API_BASE}/api/v1/rtcm/configure`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(requestBody),
//     }).then(handleResponse);
//   },

//   startNTRIP: async (host: string, port: number, mountpoint: string, password: string, username?: string) => {
//     const requestBody = { host, port, mountpoint, password, username: username ?? "" };
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/ntrip/start:`, requestBody);

//     return fetch(`${API_BASE}/api/v1/ntrip/start`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(requestBody),
//     }).then(handleResponse);
//   },

//   stopNTRIP: async () => {
//     console.log(`📤 API Request [POST] ${API_BASE}/api/v1/ntrip/stop:`, {});

//     return fetch(`${API_BASE}/api/v1/ntrip/stop`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     }).then(handleResponse);
//   },
// };

























/* =========================================
   GNSS Backend API Layer
   ========================================= */

// ⭐ Changed to 'let' so the app can update it dynamically
let API_BASE = "http://192.168.1.33:8000"; 
const isSecure = window.location.protocol === "https:";
const WS_PROTOCOL = isSecure ? "wss" : "ws";

// ⭐ Changed to 'let'
export let WS_URL = `${WS_PROTOCOL}://192.168.1.33:8000/ws/status`;

// ⭐ NEW: The function that updates the IP when the scanner finds the hardware
export const setApiHost = (newWsUrl: string) => {
  try {
    const parsed = new URL(newWsUrl);
    const newIp = parsed.hostname;
    const newPort = parsed.port || '8000';
    
    API_BASE = `http://${newIp}:${newPort}`;
    WS_URL = newWsUrl;
    console.log(`🔗 API Target dynamically updated to: ${API_BASE}`);
  } catch (e) {
    console.error("Could not parse new API host", e);
  }
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }
  const responseData = await response.json();
  console.log(`📥 API Response [${response.status}] ${response.url}:`, responseData);
  return responseData;
};

export const api = {
  getHealth: async () => fetch(`${API_BASE}/api/v1/health`).then(handleResponse),
  getStatus: async () => fetch(`${API_BASE}/api/v1/status`).then(handleResponse),
  getSurvey: async () => fetch(`${API_BASE}/api/v1/survey`).then(handleResponse),
  getSurveyStatus: async () => {
    const res = await fetch(`${API_BASE}/api/v1/survey`);
    const data = await res.json();
    console.log(`📥 API Response [${res.status}] ${res.url}:`, data);
    return data;
  },
  getRTCM: async () => fetch(`${API_BASE}/api/v1/rtcm`).then(handleResponse),
  getNTRIP: async () => fetch(`${API_BASE}/api/v1/ntrip`).then(handleResponse),

  startSurvey: async (minDurationSec: number, accuracyLimitM: number) => {
    const requestBody = { min_duration_sec: minDurationSec, accuracy_limit_m: accuracyLimitM };
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/survey/start:`, requestBody);

    return fetch(`${API_BASE}/api/v1/survey/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }).then(handleResponse);
  },

  stopSurvey: async () => {
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/survey/stop:`, {});
    return fetch(`${API_BASE}/api/v1/survey/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },

  getAutoFlowConfig: async () => fetch(`${API_BASE}/api/v1/autoflow/config`).then(handleResponse),
  getAutoFlowStatus: async () => fetch(`${API_BASE}/api/v1/autoflow/status`).then(handleResponse),

  enableAutoFlow: async (config: any) => {
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/autoflow/enable:`, config);
    return fetch(`${API_BASE}/api/v1/autoflow/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then(handleResponse);
  },

  disableAutoFlow: async () => {
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/autoflow/disable`);
    return fetch(`${API_BASE}/api/v1/autoflow/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },

  startAutoFlow: async (config: any) => {
    console.log(`ðŸ“¤ API Request [POST] ${API_BASE}/api/v1/autoflow/start:`, config);
    return fetch(`${API_BASE}/api/v1/autoflow/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then(handleResponse);
  },

  stopAutoFlow: async () => {
    console.log(`ðŸ“¤ API Request [POST] ${API_BASE}/api/v1/autoflow/stop`);
    return fetch(`${API_BASE}/api/v1/autoflow/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },

  configureRTCM: async (msmType: 'MSM4' | 'MSM7') => {
    const requestBody = { msm_type: msmType };
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/rtcm/configure:`, requestBody);

    return fetch(`${API_BASE}/api/v1/rtcm/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }).then(handleResponse);
  },

  startNTRIP: async (host: string, port: number, mountpoint: string, password: string, username?: string) => {
    const requestBody = { host, port, mountpoint, password, username: username ?? "" };
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/ntrip/start:`, requestBody);

    return fetch(`${API_BASE}/api/v1/ntrip/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }).then(handleResponse);
  },

  stopNTRIP: async () => {
    console.log(`📤 API Request [POST] ${API_BASE}/api/v1/ntrip/stop:`, {});
    return fetch(`${API_BASE}/api/v1/ntrip/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },
};
