/**
 * ============================================
 * GNSS Backend Logging Script
 * ============================================
 * Monitors all backend endpoints and WebSocket events
 * Logs all data with timestamps to console and file
 */

import * as fs from "fs";
import * as path from "path";

/* ================= CONFIG ================= */

const readOption = (name: string): string | undefined => {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : undefined;
};

const apiBaseFromInput = readOption("api-base") ?? process.env.GNSS_API_BASE;

if (!apiBaseFromInput) {
  throw new Error(
    "GNSS API base is required. Pass --api-base=http://<host>:<port> or set GNSS_API_BASE."
  );
}

const API_BASE = apiBaseFromInput.replace(/\/$/, "");
const apiUrl = new URL(API_BASE);
const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = readOption("ws-url") ?? process.env.GNSS_WS_URL ?? `${wsProtocol}//${apiUrl.host}/ws/status`;
const LOG_DIR = path.join(__dirname, "../logs");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const LOG_FILE = path.join(LOG_DIR, `backend-log-${TIMESTAMP}.json`);

/* ================= CREATE LOG DIR ================= */

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`📁 Created log directory: ${LOG_DIR}`);
}

/* ================= UTILITIES ================= */

interface LogEntry {
  timestamp: string;
  type: "ENDPOINT" | "WEBSOCKET" | "ERROR" | "INFO";
  endpoint?: string;
  method?: string;
  status?: number;
  data?: unknown;
  duration?: number;
  error?: string;
}

const logs: LogEntry[] = [];

const addLog = (entry: Omit<LogEntry, "timestamp">) => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.push(logEntry);
  return logEntry;
};

const printLog = (entry: LogEntry) => {
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
    console.log(`   ⏱️  Duration: ${entry.duration}ms`);
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

interface EndpointTest {
  name: string;
  method: "GET" | "POST";
  endpoint: string;
  body?: unknown;
  delay?: number;
}

const endpoints: EndpointTest[] = [
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

const testEndpoint = async (test: EndpointTest) => {
  const startTime = performance.now();

  try {
    console.log(`\n📡 Testing: ${test.name}`);

    const options: RequestInit = {
      method: test.method,
      headers: { "Content-Type": "application/json" },
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(`${API_BASE}${test.endpoint}`, options);
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
      await new Promise((resolve) => setTimeout(resolve, test.delay));
    }

    return { success: true, data: responseData };
  } catch (error) {
    const duration = performance.now() - startTime;
    const logEntry = addLog({
      type: "ERROR",
      endpoint: test.endpoint,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    printLog(logEntry);
    return { success: false, error };
  }
};

/* ================= WEBSOCKET TEST ================= */

const testWebSocket = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log("\n🔌 Connecting to WebSocket...");

    const startTime = Date.now();
    let messageCount = 0;
    const maxMessages = 5;

    try {
      const ws = new (require("ws"))(WS_URL);

      ws.on("open", () => {
        const logEntry = addLog({
          type: "WEBSOCKET",
          endpoint: WS_URL,
          data: "WebSocket connected",
        });
        printLog(logEntry);
      });

      ws.on("message", (data: unknown) => {
        messageCount++;
        try {
          const parsedData =
            typeof data === "string" ? JSON.parse(data) : data;

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
            error: `Failed to parse WebSocket message: ${parseError}`,
          });
          printLog(logEntry);
        }
      });

      ws.on("error", (error: unknown) => {
        const logEntry = addLog({
          type: "ERROR",
          endpoint: WS_URL,
          error: `WebSocket error: ${error}`,
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
        error: `WebSocket connection failed: ${error}`,
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
  for (const endpoint of endpoints.filter((e) => e.method === "GET")) {
    await testEndpoint(endpoint);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Test POST endpoints
  console.log("\n⚙️ Testing POST Endpoints...\n");
  for (const endpoint of endpoints.filter((e) => e.method === "POST")) {
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
  console.log(
    `❌ Errors: ${logs.filter((l) => l.type === "ERROR").length}`
  );
  console.log("================================================\n");

  saveLogs();

  // Print sample of data
  console.log("📄 Sample Health Check Response:");
  const healthLog = logs.find((l) =>
    l.endpoint?.includes("/health")
  );
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
