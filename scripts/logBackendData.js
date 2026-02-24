#!/usr/bin/env node

/**
 * ============================================
 * GNSS Backend Logging Script (Node.js)
 * ============================================
 * Run this script to log all backend data:
 * node logBackendData.js
 * 
 * Or with npm:
 * npm run log:backend
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import WebSocket from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= CONFIG ================= */

const API_BASE = "http://192.168.1.33:8000";
const WS_URL = "ws://192.168.1.33:8000/ws/status";
const LOG_DIR = path.join(__dirname, "../logs");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const LOG_FILE = path.join(LOG_DIR, `backend-log-${TIMESTAMP}.json`);

/* ================= CREATE LOG DIR ================= */

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`📁 Created log directory: ${LOG_DIR}`);
}

/* ================= UTILITIES ================= */

const logs = [];

const addLog = (entry) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.push(logEntry);
  return logEntry;
};

const printLog = (entry) => {
  const icon =
    entry.type === "ERROR"
      ? "❌"
      : entry.type === "WEBSOCKET"
        ? "🔌"
        : entry.type === "ENDPOINT"
          ? "📡"
          : "ℹ️";

  console.log(
    `${icon} [${entry.timestamp}] ${entry.type}: ${entry.endpoint || entry.data || entry.error}`
  );

  if (entry.duration) {
    console.log(`   ⏱️  Duration: ${entry.duration.toFixed(2)}ms`);
  }
  if (entry.status) {
    console.log(`   📊 Status: ${entry.status}`);
  }
};

const saveLogs = () => {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
  console.log(`\n✅ Logs saved to: ${LOG_FILE}`);
};

/* ================= ENDPOINT TESTS ================= */

const endpoints = [
  {
    name: "Health Check",
    method: "GET",
    endpoint: "/api/v1/health",
  },
  {
    name: "GNSS Status",
    method: "GET",
    endpoint: "/api/v1/status",
  },
  {
    name: "Survey Status",
    method: "GET",
    endpoint: "/api/v1/survey",
  },
  {
    name: "RTCM Statistics",
    method: "GET",
    endpoint: "/api/v1/rtcm",
  },
  {
    name: "NTRIP Status",
    method: "GET",
    endpoint: "/api/v1/ntrip",
  },
  {
    name: "Start Survey-In",
    method: "POST",
    endpoint: "/api/v1/survey/start",
    body: {
      min_duration_sec: 120,
      accuracy_limit_m: 2.0,
    },
    delay: 2000,
  },
  {
    name: "Configure RTCM",
    method: "POST",
    endpoint: "/api/v1/rtcm/configure",
    body: {
      enable_beidou: true,
    },
    delay: 1000,
  },
  {
    name: "Start NTRIP",
    method: "POST",
    endpoint: "/api/v1/ntrip/start",
    body: {
      host: "caster.emlid.com",
      port: 2101,
      mountpoint: "TEST",
      password: "test_password",
      username: "test_user",
    },
    delay: 1000,
  },
  {
    name: "Stop NTRIP",
    method: "POST",
    endpoint: "/api/v1/ntrip/stop",
    delay: 1000,
  },
  {
    name: "Stop Survey-In",
    method: "POST",
    endpoint: "/api/v1/survey/stop",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testEndpoint = async (test) => {
  const startTime = performance.now();

  try {
    console.log(`\n📡 Testing: ${test.name}`);

    const options = {
      method: test.method,
      headers: { "Content-Type": "application/json" },
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const f = await fetch;
    const response = await f(`${API_BASE}${test.endpoint}`, options);
    const duration = performance.now() - startTime;
    const responseData = await response.json();

    const logEntry = addLog({
      type: "ENDPOINT",
      endpoint: test.endpoint,
      method: test.method,
      status: response.status,
      data: responseData,
      duration,
    });

    printLog(logEntry);

    if (test.delay) {
      await sleep(test.delay);
    }

    return { success: true, data: responseData };
  } catch (error) {
    const duration = performance.now() - startTime;
    const logEntry = addLog({
      type: "ERROR",
      endpoint: test.endpoint,
      error: error.message,
      duration,
    });

    printLog(logEntry);
    return { success: false, error };
  }
};

/* ================= WEBSOCKET TEST ================= */

const testWebSocket = () => {
  return new Promise((resolve) => {
    console.log("\n🔌 Connecting to WebSocket...");

    const startTime = Date.now();
    let messageCount = 0;
    const maxMessages = 5;

    try {
      const ws = new WebSocket(WS_URL);

      ws.on("open", () => {
        const logEntry = addLog({
          type: "WEBSOCKET",
          endpoint: WS_URL,
          data: "WebSocket connected",
        });
        printLog(logEntry);
      });

      ws.on("message", (data) => {
        messageCount++;
        try {
          const parsedData = JSON.parse(data);

          const logEntry = addLog({
            type: "WEBSOCKET",
            endpoint: WS_URL,
            data: {
              messageNumber: messageCount,
              ...parsedData,
            },
          });

          printLog(logEntry);

          if (messageCount >= maxMessages) {
            ws.close();
            const closeLog = addLog({
              type: "WEBSOCKET",
              endpoint: WS_URL,
              data: `Received ${maxMessages} messages, closing connection`,
            });
            printLog(closeLog);
            resolve();
          }
        } catch (parseError) {
          const logEntry = addLog({
            type: "ERROR",
            endpoint: WS_URL,
            error: `Failed to parse WebSocket message: ${parseError.message}`,
          });
          printLog(logEntry);
        }
      });

      ws.on("error", (error) => {
        const logEntry = addLog({
          type: "ERROR",
          endpoint: WS_URL,
          error: `WebSocket error: ${error.message}`,
        });
        printLog(logEntry);
        resolve();
      });

      ws.on("close", () => {
        const duration = Date.now() - startTime;
        const logEntry = addLog({
          type: "WEBSOCKET",
          endpoint: WS_URL,
          data: "WebSocket closed",
          duration,
        });
        printLog(logEntry);
        resolve();
      });

      setTimeout(() => {
        if (ws.readyState === 1) {
          ws.close();
        }
      }, 30000); // 30 second timeout
    } catch (error) {
      const logEntry = addLog({
        type: "ERROR",
        endpoint: WS_URL,
        error: `WebSocket connection failed: ${error.message}`,
      });
      printLog(logEntry);
      resolve();
    }
  });
};

/* ================= MAIN ================= */

const main = async () => {
  console.log("================================================");
  console.log("🚀 GNSS Backend Logging Script Started");
  console.log("================================================");
  console.log(`📍 Backend URL: ${API_BASE}`);
  console.log(`🔌 WebSocket URL: ${WS_URL}`);
  console.log(`📁 Log File: ${LOG_FILE}`);
  console.log("================================================\n");

  const infoLog = addLog({
    type: "INFO",
    data: "Logging script started",
  });
  printLog(infoLog);

  // Test all GET endpoints first
  console.log("\n📊 Testing GET Endpoints...\n");
  const getEndpoints = endpoints.filter((e) => e.method === "GET");
  for (const endpoint of getEndpoints) {
    await testEndpoint(endpoint);
    await sleep(500);
  }

  // Test POST endpoints
  console.log("\n⚙️ Testing POST Endpoints...\n");
  const postEndpoints = endpoints.filter((e) => e.method === "POST");
  for (const endpoint of postEndpoints) {
    await testEndpoint(endpoint);
  }

  // Test WebSocket
  console.log("\n🔌 Testing WebSocket Connection...\n");
  await testWebSocket();

  // Summary
  console.log("\n================================================");
  console.log("📊 Logging Summary");
  console.log("================================================");
  console.log(`📝 Total Log Entries: ${logs.length}`);
  console.log(
    `✅ Endpoints: ${logs.filter((l) => l.type === "ENDPOINT").length}`
  );
  console.log(
    `🔌 WebSocket Messages: ${logs.filter((l) => l.type === "WEBSOCKET").length}`
  );
  console.log(`❌ Errors: ${logs.filter((l) => l.type === "ERROR").length}`);
  console.log("================================================\n");

  saveLogs();

  // Print sample of data
  console.log("📄 Sample Health Check Response:");
  const healthLog = logs.find((l) => l.endpoint?.includes("/health"));
  if (healthLog?.data) {
    console.log(JSON.stringify(healthLog.data, null, 2));
  }

  console.log("\n✨ Logging script completed!");
  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  saveLogs();
  process.exit(1);
});
