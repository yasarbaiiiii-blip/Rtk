#!/usr/bin/env node

/**
 * ============================================
 * Terminal Logger Server
 * ============================================
 * Receives logs from the UI and displays them in terminal
 * 
 * Usage: node logTerminalServer.js
 * Or: npm run log:terminal
 */

import http from "http";

// Configuration
const PORT = 3001;
const LOGS = [];
const MAX_LOGS = 500;

// Color codes for terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Format and print log
 */
const printLog = (entry) => {
  const { timestamp, action, component, data, error, duration } = entry;
  const time = new Date(timestamp).toLocaleTimeString();

  let icon = "✨";
  let color = colors.green;

  if (error) {
    icon = "❌";
    color = colors.red;
  } else if (action.includes("Survey") || action.includes("RTCM")) {
    icon = "⚡";
    color = colors.yellow;
  } else if (action.includes("WebSocket")) {
    icon = "🔌";
    color = colors.cyan;
  } else if (action.includes("Connect")) {
    icon = "🔗";
    color = colors.blue;
  }

  const componentStr = `${colors.dim}[${component}]${colors.reset}`;
  const timeStr = `${colors.dim}${time}${colors.reset}`;

  console.log(
    `${icon} ${timeStr} ${componentStr} ${color}${action}${colors.reset}`
  );

  if (error) {
    console.log(`   ${colors.red}❌ Error: ${error}${colors.reset}`);
  }

  if (data) {
    const dataStr =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    console.log(`   ${colors.dim}📊 ${dataStr}${colors.reset}`);
  }

  if (duration) {
    console.log(`   ${colors.dim}⏱️  ${duration.toFixed(2)}ms${colors.reset}`);
  }
};

/**
 * HTTP Server
 */
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Receive logs
  if (req.url === "/log" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const entry = JSON.parse(body);
        LOGS.push(entry);

        // Keep buffer size manageable
        if (LOGS.length > MAX_LOGS) {
          LOGS.shift();
        }

        printLog(entry);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Get all logs
  if (req.url === "/logs" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(LOGS));
    return;
  }

  // Not found
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("\n================================================");
  console.log("🖥️  Terminal Logger Server Started");
  console.log("================================================");
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log("📝 Receiving logs from UI...");
  console.log("💡 Make sure UI is running at http://localhost:5173");
  console.log("================================================\n");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n================================================");
  console.log("📊 Terminal Logger Summary");
  console.log("================================================");
  console.log(`Total logs received: ${LOGS.length}`);
  console.log("================================================\n");
  process.exit(0);
});
