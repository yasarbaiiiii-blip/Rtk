/**
 * ============================================
 * Browser-based BackendLogger
 * ============================================
 * Logs all API calls and WebSocket events
 * Can be integrated into React components for debugging
 */

import { api, getWsUrl } from "../api/gnssApiDynamic";

export interface BackendLog {
  id: string;
  timestamp: Date;
  type: "API_CALL" | "API_RESPONSE" | "API_ERROR" | "WEBSOCKET_EVENT";
  endpoint?: string;
  method?: string;
  status?: number;
  data?: unknown;
  error?: Error | string;
  duration?: number;
}

class BackendLogger {
  private logs: BackendLog[] = [];
  private maxLogs: number = 1000;
  private listeners: ((log: BackendLog) => void)[] = [];
  private wsRef: WebSocket | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Intercept API calls
    this.interceptAPI();
  }

  /**
   * Add a log entry
   */
  private addLog(
    type: BackendLog["type"],
    data: Omit<BackendLog, "id" | "timestamp" | "type">
  ): BackendLog {
    const log: BackendLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      ...data,
    };

    this.logs.push(log);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(log));

    return log;
  }

  /**
   * Intercept all API calls
   */
  private interceptAPI() {
    const originalFetch = window.fetch;

    (window.fetch as any) = async (resource: any, config?: any) => {
      const endpoint =
        typeof resource === "string" ? resource : (resource.url || "");
      const method = config?.method || "GET";

      // Log API call
      const callLog = this.addLog("API_CALL", {
        endpoint,
        method,
      });

      const startTime = performance.now();

      try {
        const response = await originalFetch(resource, config);
        const duration = performance.now() - startTime;

        // Try to clone and read response
        let responseData: unknown;
        try {
          const clonedResponse = response.clone();
          responseData = await clonedResponse.json();
        } catch {
          responseData = await response.text();
        }

        // Log API response
        const responseLog = this.addLog("API_RESPONSE", {
          endpoint,
          method,
          status: response.status,
          data: responseData,
          duration,
        });

        return response.clone();
      } catch (error) {
        const duration = performance.now() - startTime;

        // Log API error
        this.addLog("API_ERROR", {
          endpoint,
          method,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });

        throw error;
      }
    };
  }

  /**
   * Connect to WebSocket and log events
   */
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = getWsUrl();
      try {
        if (!wsUrl) {
          resolve();
          return;
        }

        this.wsRef = new WebSocket(wsUrl);

        this.wsRef.onopen = () => {
          this.addLog("WEBSOCKET_EVENT", {
            endpoint: wsUrl,
            data: {
              event: "connected",
              timestamp: new Date().toISOString(),
            },
          });
          resolve();
        };

        this.wsRef.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.addLog("WEBSOCKET_EVENT", {
              endpoint: wsUrl,
              data: {
                event: "message",
                message: data,
              },
            });
          } catch (error) {
            this.addLog("API_ERROR", {
              endpoint: wsUrl,
              error: `Failed to parse WebSocket message: ${error}`,
            });
          }
        };

        this.wsRef.onerror = (error) => {
          this.addLog("API_ERROR", {
            endpoint: wsUrl,
            error: `WebSocket error: ${error}`,
          });
          reject(error);
        };

        this.wsRef.onclose = () => {
          this.addLog("WEBSOCKET_EVENT", {
            endpoint: wsUrl,
            data: {
              event: "disconnected",
              timestamp: new Date().toISOString(),
            },
          });
        };
      } catch (error) {
        this.addLog("API_ERROR", {
          endpoint: wsUrl,
          error: `WebSocket connection failed: ${error}`,
        });
        reject(error);
      }
    });
  }

  /**
   * Close WebSocket connection
   */
  disconnectWebSocket() {
    const wsUrl = getWsUrl();
    if (this.wsRef) {
      this.wsRef.close();
      this.addLog("WEBSOCKET_EVENT", {
        endpoint: wsUrl ?? undefined,
        data: { event: "manual_disconnect" },
      });
    }
  }

  /**
   * Test all endpoints
   */
  async testAllEndpoints(): Promise<void> {
    const endpoints = [
      { name: "Health Check", call: () => api.getHealth() },
      { name: "GNSS Status", call: () => api.getStatus() },
      { name: "Survey Status", call: () => api.getSurvey() },
      { name: "RTCM Statistics", call: () => api.getRTCM() },
      { name: "NTRIP Status", call: () => api.getNTRIP() },
    ];

    for (const endpoint of endpoints) {
      try {
        await endpoint.call();
      } catch (error) {
        console.error(`❌ ${endpoint.name} failed:`, error);
      }
      // Small delay between calls
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Endpoint testing complete
  }

  /**
   * Get all logs
   */
  getLogs(): BackendLog[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by type
   */
  getLogsByType(type: BackendLog["type"]): BackendLog[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Get logs filtered by endpoint
   */
  getLogsByEndpoint(endpoint: string): BackendLog[] {
    return this.logs.filter((log) => log.endpoint?.includes(endpoint));
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsCSV(): string {
    const headers = [
      "Timestamp",
      "Type",
      "Endpoint",
      "Method",
      "Status",
      "Duration",
      "Data",
    ];

    const rows = this.logs.map((log) => [
      log.timestamp.toISOString(),
      log.type,
      log.endpoint || "",
      log.method || "",
      log.status || "",
      log.duration || "",
      typeof log.data === "string"
        ? log.data
        : JSON.stringify(log.data || ""),
    ]);

    return [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
  }

  /**
   * Download logs as file
   */
  downloadLogs(format: "json" | "csv" = "json") {
    const content =
      format === "json" ? this.exportLogsJSON() : this.exportLogsCSV();
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/csv",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backend-logs-${new Date().toISOString()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Subscribe to log changes
   */
  subscribe(listener: (log: BackendLog) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      total: this.logs.length,
      byType: {} as Record<BackendLog["type"], number>,
      byEndpoint: {} as Record<string, number>,
      averageResponseTime: 0,
      errors: 0,
    };

    let totalDuration = 0;
    let responseCount = 0;

    this.logs.forEach((log) => {
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

      // Count by endpoint
      if (log.endpoint) {
        stats.byEndpoint[log.endpoint] =
          (stats.byEndpoint[log.endpoint] || 0) + 1;
      }

      // Average response time
      if (log.duration && log.type === "API_RESPONSE") {
        totalDuration += log.duration;
        responseCount++;
      }

      // Error count
      if (log.type === "API_ERROR") {
        stats.errors++;
      }
    });

    if (responseCount > 0) {
      stats.averageResponseTime = totalDuration / responseCount;
    }

    return stats;
  }

  /**
   * Print statistics to console
   */
  printStatistics() {
    const stats = this.getStatistics();
    // Statistics logged
  }
}

// Singleton instance
export const backendLogger = new BackendLogger();
