/* =========================================
   GNSS Backend API Layer
   ========================================= */

let apiBase: string | null = null;
export let WS_URL: string | null = null;

const requireApiBase = () => {
  if (!apiBase) {
    throw new Error("GNSS API host is not set. Connect to a device first.");
  }

  return apiBase;
};

export const setApiHost = (newWsUrl: string) => {
  try {
    const parsed = new URL(newWsUrl);
    const protocol = parsed.protocol === "wss:" ? "https:" : "http:";
    const port = parsed.port || (protocol === "https:" ? "443" : "8000");

    apiBase = `${protocol}//${parsed.hostname}:${port}`;
    WS_URL = newWsUrl;
    console.log(`API target dynamically updated to: ${apiBase}`);
  } catch (error) {
    console.error("Could not parse new API host", error);
  }
};

export const getApiHost = () => apiBase;
export const getWsUrl = () => WS_URL;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }

  const responseData = await response.json();
  console.log(`API Response [${response.status}] ${response.url}:`, responseData);
  return responseData;
};

export const api = {
  getHealth: async () => fetch(`${requireApiBase()}/api/v1/health`).then(handleResponse),
  getStatus: async () => fetch(`${requireApiBase()}/api/v1/status`).then(handleResponse),
  getStatusPosition: async () => fetch(`${requireApiBase()}/api/v1/status/position`).then(handleResponse),
  getStatusRTCM: async () => fetch(`${requireApiBase()}/api/v1/status/rtcm`).then(handleResponse),
  getStatusNTRIP: async () => fetch(`${requireApiBase()}/api/v1/status/ntrip`).then(handleResponse),
  getStatusSurvey: async () => fetch(`${requireApiBase()}/api/v1/status/survey`).then(handleResponse),
  getSavedBasePosition: async () => fetch(`${requireApiBase()}/api/v1/base/saved-position`).then(handleResponse),
  deleteSavedBasePosition: async (confirm: boolean = true) => {
    const base = requireApiBase();
    return fetch(`${base}/api/v1/base/saved-position?confirm=${confirm ? "true" : "false"}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },
  confirmResurvey: async () => {
    const base = requireApiBase();
    return fetch(`${base}/api/v1/base/confirm-resurvey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },
  skipResurvey: async () => {
    const base = requireApiBase();
    return fetch(`${base}/api/v1/base/skip-resurvey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },
  getSurvey: async () => fetch(`${requireApiBase()}/api/v1/survey`).then(handleResponse),
  getSurveyStatus: async () => {
    const base = requireApiBase();
    const res = await fetch(`${base}/api/v1/survey`);
    const data = await res.json();
    console.log(`API Response [${res.status}] ${res.url}:`, data);
    return data;
  },
  getRTCM: async () => fetch(`${requireApiBase()}/api/v1/rtcm`).then(handleResponse),
  getNTRIP: async () => fetch(`${requireApiBase()}/api/v1/ntrip`).then(handleResponse),

  getAutoFlowConfig: async () => fetch(`${requireApiBase()}/api/v1/autoflow/config`).then(handleResponse),
  saveAutoFlowConfig: async (config: any) => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/autoflow/config:`, config);
    return fetch(`${base}/api/v1/autoflow/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then(handleResponse);
  },
  getAutoFlowStatus: async () => fetch(`${requireApiBase()}/api/v1/autoflow/status`).then(handleResponse),

  enableAutoFlow: async (config: any) => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/autoflow/enable:`, config);
    return fetch(`${base}/api/v1/autoflow/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then(handleResponse);
  },

  disableAutoFlow: async () => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/autoflow/disable`);
    return fetch(`${base}/api/v1/autoflow/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },

  startAutoFlow: async (config: any) => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/autoflow/start:`, config);
    return fetch(`${base}/api/v1/autoflow/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then(handleResponse);
  },

  stopAutoFlow: async () => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/autoflow/stop`);
    return fetch(`${base}/api/v1/autoflow/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },

  configureRTCM: async (msmType: "MSM4" | "MSM7") => {
    const base = requireApiBase();
    const requestBody = { msm_type: msmType };
    console.log(`API Request [POST] ${base}/api/v1/rtcm/configure:`, requestBody);

    return fetch(`${base}/api/v1/rtcm/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }).then(handleResponse);
  },

  configureFixedBase: async (config: any) => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/base/fixed:`, config);
    return fetch(`${base}/api/v1/base/fixed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then(handleResponse);
  },

  startNTRIP: async (host: string, port: number, mountpoint: string, password: string, username?: string) => {
    const base = requireApiBase();
    const requestBody = { host, port, mountpoint, password, username: username ?? "" };
    console.log(`API Request [POST] ${base}/api/v1/ntrip/start:`, requestBody);

    return fetch(`${base}/api/v1/ntrip/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }).then(handleResponse);
  },

  stopNTRIP: async () => {
    const base = requireApiBase();
    console.log(`API Request [POST] ${base}/api/v1/ntrip/stop:`, {});
    return fetch(`${base}/api/v1/ntrip/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then(handleResponse);
  },
};
