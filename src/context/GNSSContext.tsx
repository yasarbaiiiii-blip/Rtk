import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  ConnectionState,
  SurveyState,
  GNSSStatus,
  StreamState,
  Configuration,
  WiFiNetwork,
  BLEDevice,
  LogEntry,
  SurveyHistoryEntry,
  AppSettings,
  Satellite,
} from "../types/gnss";

import { api, getApiHost, getWsUrl, setApiHost } from "../api/gnssApiDynamic";
import { scanWifi, connectWifi } from "../native/wifi";
import { connectBle, scanBleDevices } from "../native/ble";
import { uiLogger } from "../utils/uiLogger";
import { toast } from "sonner";
import { stealthPing, validateManualIP } from "../utils/ipDiscovery"; 

/* ================= CONTEXT TYPE ================= */

type GNSSContextType = {
  connection: ConnectionState;
  connectToDevice: (type: "wifi" | "ble" | "auto", identifier: string, password?: string, wsUrl?: string) => Promise<void>;
  disconnect: () => void;
  survey: SurveyState;
  startSurvey: () => Promise<void>;
  stopSurvey: () => Promise<void>;
  isAutoFlowActive: boolean;
  gnssStatus: GNSSStatus;
  streams: StreamState;
  toggleStream: (key: keyof StreamState, enabled: boolean) => Promise<void>;
  configuration: Configuration;
  updateConfiguration: (config: Configuration) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  availableWiFiNetworks: WiFiNetwork[];
  availableBLEDevices: BLEDevice[];
  scanWiFi: () => Promise<void>;
  scanBLE: () => Promise<void>;
  surveyHistory: SurveyHistoryEntry[];
  logs: LogEntry[];
  addLog: (level: 'error' | 'warning' | 'info', message: string) => void;
  clearLogs: () => void;
  deleteLogs: (ids: string[]) => void;
  clearSurveyHistory: () => void; 
  deleteSurveys: (ids: string[]) => void;
  exportHistoryCSV: () => Promise<void>;
  exportLogsCSV: () => Promise<void>;
  startNTRIP: (host: string, port: number, mountpoint: string, password: string, username?: string) => Promise<void>;
  stopNTRIP: () => Promise<void>;
};

const GNSSContext = createContext<GNSSContextType | null>(null);

export const useGNSS = () => {
  const ctx = useContext(GNSSContext);
  if (!ctx) throw new Error("useGNSS must be used inside GNSSProvider");
  return ctx;
};

/* ================= PROVIDER ================= */

export const GNSSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const activeWsUrlRef = useRef<string | null>(null);
  const stoppingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const startPendingRef = useRef(false);
  const lastNtripSampleRef = useRef<{ bytesSent: number; at: number } | null>(null);
  const startInitiatedAtRef = useRef(0);
  const inactiveSurveyReportsRef = useRef(0);
  const lastSurveyActiveAtRef = useRef(0);
  const hasSeenActiveRef = useRef(false);
  const startupPollLogCountRef = useRef(0);
  const startupWsLogCountRef = useRef(0);
  const START_PENDING_GRACE_MS = 3500;
  const STORAGE_KEYS = {
    connection: 'gnss_connection',
    survey: 'gnss_survey',
    gnssStatus: 'gnss_status',
    streams: 'gnss_streams',
    history: 'gnss_history',
    logs: 'gnss_logs',
    configuration: 'gnss_configuration',
    settings: 'gnss_settings',
    lastWs: 'gnss_last_ws',
    ntripArmed: 'gnss_ntrip_user_armed',
  } as const;

  const defaultStream = { enabled: false, active: false, throughput: 0, messageRate: 0 };
  const DEFAULT_CONNECTION: ConnectionState = {
    connectionType: "none",
    isConnected: false,
    lastConnectedTimestamp: null,
    signalStrength: 0,
    latency: 0,
    autoReconnect: true,
  };
  const DEFAULT_SURVEY: SurveyState = {
    surveyMode: "survey-in",
    isActive: false,
    valid: false,
    progress: 0,
    elapsedTime: 0,
    requiredTime: 30,
    currentAccuracy: 0,
    targetAccuracy: 200,
    position: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
    localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
    status: "idle",
    satelliteCount: 0,
  };
  const createDefaultGNSSStatus = (): GNSSStatus => ({
    satellites: [],
    fixType: "none",
    dop: { hdop: null, vdop: null, pdop: null },
    updateRate: 1,
    lastUpdate: new Date(),
    firmwareVersion: "unknown",
    activeConstellations: [],
    globalPosition: { latitude: 0, longitude: 0, altitude: 0, horizontalAccuracy: 0 },
  });
  const DEFAULT_STREAMS: StreamState = {
    serial: { ...defaultStream },
    ntrip: { ...defaultStream, mountpoint: "", uptime: 0, dataSent: 0, dataReceived: 0, lastError: null },
    tcp: { ...defaultStream, connectedClients: 0 },
    udp: { ...defaultStream },
  };

  /* ================= STATE ================= */

  const [connection, setConnection] = useState<ConnectionState>(DEFAULT_CONNECTION);

  const [survey, setSurvey] = useState<SurveyState>(DEFAULT_SURVEY);

  const [isAutoFlowActive, setIsAutoFlowActive] = useState(false);

  const [gnssStatus, setGNSSStatus] = useState<GNSSStatus>(createDefaultGNSSStatus);

  const [streams, setStreams] = useState<StreamState>(DEFAULT_STREAMS);

  const [availableWiFiNetworks, setAvailableWiFiNetworks] = useState<WiFiNetwork[]>([]);
  const [availableBLEDevices, setAvailableBLEDevices] = useState<BLEDevice[]>([]);
  const [surveyHistory, setSurveyHistory] = useState<SurveyHistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isNtripUserArmed, setIsNtripUserArmed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ntripArmed) === '1';
    } catch {
      return false;
    }
  });
  const [lastSavedWsUrl, setLastSavedWsUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.lastWs);
    } catch {
      return null;
    }
  });

  /* ================= PERSISTED DEFAULTS ================= */
  const DEFAULT_CONFIG: Configuration = {
    baseStation: {
      surveyDuration: 120,
      accuracyThreshold: 200,
      autoStart: false,
      autoMode: false,
      fixedMode: { enabled: false, coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 } },
    },
    streams: {
      ntrip: { server: "caster.emlid.com", port: 2101, mountpoint: "", username: "", password: "" },
      serial: { baudRate: 115200, messages: [], rates: [] },
      tcp: { port: 9000, maxClients: 5, authEnabled: false },
      udp: { port: 8001, broadcastAddress: "", multicast: false },
    },
    system: { wifiSsid: "", wifiPassword: "", ledMode: "status", ledBrightness: 80 },
  };

  const DEFAULT_SETTINGS: AppSettings = {
    units: { distance: "meters", coordinates: "DD" },
    theme: "system",
    language: "en",
    notifications: { surveyCompletion: true, connectionLoss: true, lowAccuracy: true, sound: true, vibration: true },
    connection: { preferredMethod: "auto", autoReconnect: true, timeout: 10, keepScreenAwake: true },
  };

  const loadPersistedConfig = (): Configuration => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.configuration);
      if (saved) {
        const parsed = JSON.parse(saved) as Configuration;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          baseStation: {
            ...DEFAULT_CONFIG.baseStation, ...parsed.baseStation,
            fixedMode: {
              ...DEFAULT_CONFIG.baseStation.fixedMode, ...parsed.baseStation?.fixedMode,
              coordinates: { ...DEFAULT_CONFIG.baseStation.fixedMode.coordinates, ...parsed.baseStation?.fixedMode?.coordinates },
            },
          },
          streams: {
            ...DEFAULT_CONFIG.streams, ...parsed.streams,
            ntrip: { ...DEFAULT_CONFIG.streams.ntrip, ...parsed.streams?.ntrip },
            serial: { ...DEFAULT_CONFIG.streams.serial, ...parsed.streams?.serial },
            tcp: { ...DEFAULT_CONFIG.streams.tcp, ...parsed.streams?.tcp },
            udp: { ...DEFAULT_CONFIG.streams.udp, ...parsed.streams?.udp },
          },
          system: { ...DEFAULT_CONFIG.system, ...parsed.system },
        };
      }
    } catch (e) {
      console.warn('Failed to load saved configuration, using defaults:', e);
    }
    return DEFAULT_CONFIG;
  };

  const loadPersistedSettings = (): AppSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.settings);
      if (saved) {
        const parsed = JSON.parse(saved) as AppSettings;
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          units: { ...DEFAULT_SETTINGS.units, ...parsed.units },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
          connection: { ...DEFAULT_SETTINGS.connection, ...parsed.connection },
        };
      }
    } catch (e) {
      console.warn('Failed to load saved settings, using defaults:', e);
    }
    return DEFAULT_SETTINGS;
  };

  const [configuration, setConfiguration] = useState<Configuration>(loadPersistedConfig);
  const [settings, setSettings] = useState<AppSettings>(loadPersistedSettings);

  const preserveCount = (incoming: unknown, previous: number) => {
    const next = Number(incoming);
    if (!Number.isFinite(next)) return previous;
    if (next === 0 && previous > 0) return previous;
    return next;
  };

  const preserveCoordinate = (incoming: unknown, previous: number) => {
    const next = Number(incoming);
    if (!Number.isFinite(next)) return previous;
    if (next === 0 && previous !== 0) return previous;
    return next;
  };

  const preserveOptionalNumber = (incoming: unknown, previous: number | null) => {
    const next = Number(incoming);
    if (!Number.isFinite(next)) return previous;
    return next;
  };

  const getAutoFlowPayload = useCallback(() => ({
    msm_type: "MSM4",
    min_duration_sec: configuration.baseStation.surveyDuration,
    accuracy_limit_m: configuration.baseStation.accuracyThreshold / 100,
    ntrip_host: configuration.streams.ntrip.server,
    ntrip_port: configuration.streams.ntrip.port,
    ntrip_mountpoint: configuration.streams.ntrip.mountpoint,
    ntrip_password: configuration.streams.ntrip.password,
    ntrip_username: configuration.streams.ntrip.username,
  }), [
    configuration.baseStation.surveyDuration,
    configuration.baseStation.accuracyThreshold,
    configuration.streams.ntrip.server,
    configuration.streams.ntrip.port,
    configuration.streams.ntrip.mountpoint,
    configuration.streams.ntrip.password,
    configuration.streams.ntrip.username,
  ]);

  const persistConfiguration = useCallback((config: Configuration) => {
    try {
      localStorage.setItem(STORAGE_KEYS.configuration, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save configuration:', e);
    }
  }, []);

  const syncConfigurationFromBackend = useCallback((payload: any) => {
    if (!payload || typeof payload !== "object") {
      return;
    }

    const sources = [
      payload,
      payload.config,
      payload.configuration,
      payload.autoflow,
      payload.survey,
    ].filter((source) => source && typeof source === "object");

    const readNumber = (...keys: string[]) => {
      for (const source of sources) {
        for (const key of keys) {
          const value = Number((source as Record<string, unknown>)[key]);
          if (Number.isFinite(value)) {
            return value;
          }
        }
      }
      return NaN;
    };

    const readString = (...keys: string[]) => {
      for (const source of sources) {
        for (const key of keys) {
          const value = (source as Record<string, unknown>)[key];
          if (typeof value === "string") {
            return value;
          }
        }
      }
      return undefined;
    };

    const readBoolean = (...keys: string[]) => {
      for (const source of sources) {
        for (const key of keys) {
          const value = (source as Record<string, unknown>)[key];
          if (typeof value === "boolean") {
            return value;
          }
        }
      }
      return undefined;
    };

    const nextDuration = readNumber(
      "min_duration_sec",
      "minDurationSec",
      "survey_duration_sec",
      "surveyDurationSec",
      "required_time_sec",
      "requiredTimeSec",
      "required_time_seconds",
      "requiredTimeSeconds",
      "duration_sec",
      "durationSeconds"
    );
    const nextAccuracyM = readNumber(
      "accuracy_limit_m",
      "accuracyLimitM",
      "target_accuracy_m",
      "targetAccuracyM",
      "required_accuracy_m",
      "requiredAccuracyM"
    );
    const nextAccuracyCm = readNumber(
      "accuracy_limit_cm",
      "accuracyLimitCm",
      "target_accuracy_cm",
      "targetAccuracyCm",
      "required_accuracy_cm",
      "requiredAccuracyCm"
    );
    const nextPort = readNumber("ntrip_port", "ntripPort");
    const nextAutoMode = readBoolean("enabled", "auto_mode", "autoMode");

    setConfiguration((prev) => {
      const next: Configuration = {
        ...prev,
        baseStation: {
          ...prev.baseStation,
          autoMode: typeof nextAutoMode === "boolean" ? nextAutoMode : prev.baseStation.autoMode,
          surveyDuration: Number.isFinite(nextDuration) && nextDuration > 0 ? nextDuration : prev.baseStation.surveyDuration,
          accuracyThreshold:
            Number.isFinite(nextAccuracyCm) && nextAccuracyCm >= 0
              ? Math.round(nextAccuracyCm)
              : Number.isFinite(nextAccuracyM) && nextAccuracyM >= 0
              ? Math.round(nextAccuracyM * 100)
              : prev.baseStation.accuracyThreshold,
        },
        streams: {
          ...prev.streams,
          ntrip: {
            ...prev.streams.ntrip,
            server: readString("ntrip_host", "ntripHost") || prev.streams.ntrip.server,
            port: Number.isFinite(nextPort) && nextPort > 0 ? nextPort : prev.streams.ntrip.port,
            mountpoint: readString("ntrip_mountpoint", "ntripMountpoint") ?? prev.streams.ntrip.mountpoint,
            password: readString("ntrip_password", "ntripPassword") ?? prev.streams.ntrip.password,
            username: readString("ntrip_username", "ntripUsername") ?? prev.streams.ntrip.username,
          },
        },
      };

      const changed = JSON.stringify(next) !== JSON.stringify(prev);
      if (changed) {
        persistConfiguration(next);
      }
      return changed ? next : prev;
    });
  }, [persistConfiguration]);

  useEffect(() => {
    try {
      const rawConnection = localStorage.getItem(STORAGE_KEYS.connection);
      if (rawConnection) {
        const parsed = JSON.parse(rawConnection) as ConnectionState;
        setConnection({
          ...DEFAULT_CONNECTION,
          ...parsed,
          isConnected: false,
          lastConnectedTimestamp: parsed.lastConnectedTimestamp ? new Date(parsed.lastConnectedTimestamp) : null,
        });
      }

      const rawSurvey = localStorage.getItem(STORAGE_KEYS.survey);
      if (rawSurvey) {
        const parsed = JSON.parse(rawSurvey) as SurveyState;
        setSurvey({ ...DEFAULT_SURVEY, ...parsed });
      }

      const rawGNSS = localStorage.getItem(STORAGE_KEYS.gnssStatus);
      if (rawGNSS) {
        const parsed = JSON.parse(rawGNSS) as GNSSStatus;
        setGNSSStatus({
          ...createDefaultGNSSStatus(),
          ...parsed,
          lastUpdate: parsed.lastUpdate ? new Date(parsed.lastUpdate) : new Date(),
        });
      }

      const rawStreams = localStorage.getItem(STORAGE_KEYS.streams);
      if (rawStreams) {
        const parsed = JSON.parse(rawStreams) as StreamState;
        setStreams({
          ...DEFAULT_STREAMS,
          ...parsed,
          serial: { ...DEFAULT_STREAMS.serial, ...parsed.serial },
          ntrip: isNtripUserArmed
            ? { ...DEFAULT_STREAMS.ntrip, ...parsed.ntrip }
            : { ...DEFAULT_STREAMS.ntrip, enabled: false, active: false, throughput: 0, uptime: 0, dataSent: 0, dataReceived: 0 },
          tcp: { ...DEFAULT_STREAMS.tcp, ...parsed.tcp },
          udp: { ...DEFAULT_STREAMS.udp, ...parsed.udp },
        });
      }

      const rawHistory = localStorage.getItem(STORAGE_KEYS.history);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as SurveyHistoryEntry[];
        setSurveyHistory(parsed.map((entry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })));
      }

      const rawLogs = localStorage.getItem(STORAGE_KEYS.logs);
      if (rawLogs) {
        const parsed = JSON.parse(rawLogs) as LogEntry[];
        setLogs(parsed.map((entry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })));
      }
    } catch (e) {
      console.warn('Failed to hydrate app runtime state:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.connection, JSON.stringify(connection));
    } catch (e) {
      console.warn('Failed to persist connection state:', e);
    }
  }, [connection]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.survey, JSON.stringify(survey));
    } catch (e) {
      console.warn('Failed to persist survey state:', e);
    }
  }, [survey]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.gnssStatus, JSON.stringify(gnssStatus));
    } catch (e) {
      console.warn('Failed to persist GNSS status:', e);
    }
  }, [gnssStatus]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.streams, JSON.stringify(streams));
    } catch (e) {
      console.warn('Failed to persist stream state:', e);
    }
  }, [streams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(surveyHistory));
    } catch (e) {
      console.warn('Failed to persist survey history:', e);
    }
  }, [surveyHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to persist logs:', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      if (isNtripUserArmed) {
        localStorage.setItem(STORAGE_KEYS.ntripArmed, '1');
      } else {
        localStorage.removeItem(STORAGE_KEYS.ntripArmed);
      }
    } catch (e) {
      console.warn('Failed to persist NTRIP arm state:', e);
    }
  }, [isNtripUserArmed]);

  /* ================= HELPER FUNCTIONS ================= */

  useEffect(() => {
    const syncAutoFlowConfig = () => {
      api.getAutoFlowConfig()
        .then((cfg) => {
          syncConfigurationFromBackend(cfg);
        })
        .catch(() => { });
    };

    syncAutoFlowConfig();
    const interval = setInterval(syncAutoFlowConfig, 5000);
    return () => clearInterval(interval);
  }, [syncConfigurationFromBackend]);

  useEffect(() => {
    const syncAutoFlowStatus = () => {
      if (!connection.isConnected) {
        setIsAutoFlowActive(false);
        return;
      }

      api.getAutoFlowStatus()
        .then((status) => {
          const stage = typeof status.state === 'string'
            ? status.state.toLowerCase()
            : typeof status.stage === 'string'
            ? status.stage.toLowerCase()
            : '';
          const isRunningStage = !['', 'idle', 'disabled', 'stopped', 'completed', 'complete'].includes(stage);
          setIsAutoFlowActive(Boolean(status.enabled) && isRunningStage);
        })
        .catch(() => { });
    };

    syncAutoFlowStatus();
    const interval = setInterval(syncAutoFlowStatus, 2000);
    return () => clearInterval(interval);
  }, [connection.isConnected]);

  const addLog = useCallback((level: 'error' | 'warning' | 'info', message: string) => {
    setLogs((prev) => [{ id: Date.now().toString() + Math.random(), timestamp: new Date(), level, message }, ...prev].slice(0, 500));
  }, []);

  const clearSurveyHistory = useCallback(() => {
    setSurveyHistory([]);
    toast.success("Survey history cleared");
  }, []);

  const deleteSurveys = useCallback((ids: string[]) => {
    setSurveyHistory(prev => prev.filter(s => !ids.includes(s.id)));
    toast.success(`Deleted ${ids.length} record(s)`);
  }, []);

  const deleteLogs = useCallback((ids: string[]) => {
    setLogs((prev) => prev.filter((log) => !ids.includes(log.id)));
    toast.success(`Deleted ${ids.length} log record(s)`);
  }, []);

  /* ================= WEBSOCKET ================= */

  const connectWebSocket = useCallback((customUrl?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const nextWsUrl = customUrl ?? activeWsUrlRef.current ?? lastSavedWsUrl;
    if (!nextWsUrl) {
      addLog('error', 'No WebSocket URL available for connection');
      return;
    }

    activeWsUrlRef.current = nextWsUrl;
    setApiHost(nextWsUrl);
    addLog('info', `Connecting WebSocket to ${nextWsUrl}`);
    addLog('info', `Resolved API host ${getApiHost() ?? 'unavailable'}`);

    wsRef.current = new WebSocket(nextWsUrl);

    wsRef.current.onopen = () => {
      const connectedWsUrl = activeWsUrlRef.current;
      setConnection((prev) => ({ ...prev, isConnected: true, lastConnectedTimestamp: new Date() }));
      addLog('info', 'WebSocket connected');
      void api.getAutoFlowConfig()
        .then((cfg) => {
          syncConfigurationFromBackend(cfg);
        })
        .catch(() => { });

      // ⭐ MEMORY STORAGE RULE: The moment connection is successful, securely write the IP to memory
      try {
        if (connectedWsUrl) {
          localStorage.setItem(STORAGE_KEYS.lastWs, connectedWsUrl);
          setLastSavedWsUrl(connectedWsUrl);
          console.log(`Saved successful connection: ${connectedWsUrl}`);
        }
      } catch (e) {
        console.warn('Failed to save WS URL:', e);
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const satellites: Satellite[] = Array.from(
          { length: data.gnss?.num_satellites || 0 },
          (_, i) => ({ id: i, constellation: "GPS", elevation: 0, azimuth: 0, snr: 0, used: true })
        );

        setGNSSStatus((prev) => ({
          satellites: Number.isFinite(Number(data.gnss?.num_satellites))
            ? satellites
            : prev.satellites,
          fixType: data.gnss?.fix_type ?? prev.fixType,
          dop: {
            hdop: preserveOptionalNumber(data.gnss?.hdop, prev.dop.hdop),
            vdop: preserveOptionalNumber(data.gnss?.vdop, prev.dop.vdop),
            pdop: preserveOptionalNumber(data.gnss?.pdop, prev.dop.pdop),
          },
          updateRate: Number.isFinite(Number(data.gnss?.update_rate_hz))
            ? Number(data.gnss?.update_rate_hz)
            : prev.updateRate,
          lastUpdate: new Date(),
          firmwareVersion: data.system?.firmware_version ?? prev.firmwareVersion,
          activeConstellations: prev.activeConstellations.length > 0 ? prev.activeConstellations : ["GPS"],
          globalPosition: {
            latitude: preserveCoordinate(data.gnss?.latitude, prev.globalPosition.latitude),
            longitude: preserveCoordinate(data.gnss?.longitude, prev.globalPosition.longitude),
            altitude: preserveCoordinate(data.gnss?.altitude_msl, prev.globalPosition.altitude),
            horizontalAccuracy: preserveCount(data.gnss?.horizontal_accuracy, prev.globalPosition.horizontalAccuracy),
          },
        }));

        // Runtime Autoflow state is sourced from /api/v1/autoflow/status polling.
        // WebSocket autoflow payloads can lag or use different semantics, which
        // caused the UI to flicker between idle and running.

        if (startPendingRef.current && startupWsLogCountRef.current < 8) {
          startupWsLogCountRef.current += 1;
          addLog(
            'info',
            `WS survey update ${startupWsLogCountRef.current}: active=${String(data.survey?.active ?? false)}, progress=${String(data.survey?.progress_seconds ?? 'null')}, accuracy_m=${String(data.survey?.accuracy_m ?? 'null')}`
          );
        }

        setSurvey((prev) => {
          const wsActive = data.survey?.active ?? false;
          const wsValid = data.survey?.valid ?? false;
          if (stoppingRef.current) return prev;

          const wsAccuracy = (data.survey?.accuracy_m ?? 0) * 100;
          const wsElapsed = data.survey?.progress_seconds ?? prev.elapsedTime;
          const nextActiveElapsed = Math.max(prev.elapsedTime, wsElapsed);
          
          const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
          const pos = data.survey?.position || data.survey?.local_position || {};
          
          const wsLocalCoords = {
            meanX: preserveCoordinate(parseVal(data.survey?.mean_x_m ?? data.survey?.meanX ?? data.survey?.ecef_x ?? data.survey?.x ?? pos.x ?? pos[0]), prev.localCoordinates.meanX),
            meanY: preserveCoordinate(parseVal(data.survey?.mean_y_m ?? data.survey?.meanY ?? data.survey?.ecef_y ?? data.survey?.y ?? pos.y ?? pos[1]), prev.localCoordinates.meanY),
            meanZ: preserveCoordinate(parseVal(data.survey?.mean_z_m ?? data.survey?.meanZ ?? data.survey?.ecef_z ?? data.survey?.z ?? pos.z ?? pos[2]), prev.localCoordinates.meanZ),
            observations: preserveCount(data.survey?.observations, prev.localCoordinates.observations),
          };
          const withinStartGrace =
            startPendingRef.current &&
            (prev.isActive || prev.status === "initializing") &&
            !wsActive &&
            (Date.now() - startInitiatedAtRef.current) < START_PENDING_GRACE_MS;

          if (wsActive) {
            hasSeenActiveRef.current = true;
          }

          if (wsActive && !prev.isActive) {
            startPendingRef.current = false;
            inactiveSurveyReportsRef.current = 0;
            lastSurveyActiveAtRef.current = Date.now();
            return {
              ...prev,
              isActive: true,
              status: "in-progress",
              elapsedTime: wsElapsed,
              currentAccuracy: wsAccuracy,
              satelliteCount: preserveCount(data.gnss?.num_satellites, prev.satelliteCount),
              localCoordinates: wsLocalCoords,
              valid: wsValid,
            };
          }

          if (prev.isActive) {
            if (wsActive) {
              startPendingRef.current = false;
              inactiveSurveyReportsRef.current = 0;
              lastSurveyActiveAtRef.current = Date.now();
            }
            const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;
            const shouldTreatInactiveAsFinal =
              hasSeenActiveRef.current &&
              !wsActive &&
              (
                wsValid ||
                (wsElapsed > 0 && wsElapsed >= prev.requiredTime)
              );
            if (withinStartGrace) {
              return {
                ...prev,
                satelliteCount: preserveCount(data.gnss?.num_satellites, prev.satelliteCount),
                currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
                position: {
                  latitude: data.gnss?.latitude ?? prev.position.latitude,
                  longitude: data.gnss?.longitude ?? prev.position.longitude,
                  altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
                  accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
                },
                localCoordinates: wsLocalCoords,
                valid: wsValid || prev.valid,
              };
            }

            if (startPendingRef.current && !hasSeenActiveRef.current && !wsActive) {
              return {
                ...prev,
                status: "initializing",
                satelliteCount: preserveCount(data.gnss?.num_satellites, prev.satelliteCount),
                currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
                position: {
                  latitude: data.gnss?.latitude ?? prev.position.latitude,
                  longitude: data.gnss?.longitude ?? prev.position.longitude,
                  altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
                  accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
                },
                localCoordinates: wsLocalCoords,
                valid: wsValid || prev.valid,
              };
            }

            if (!wsActive && !shouldTreatInactiveAsFinal) {
              inactiveSurveyReportsRef.current += 1;
              if (
                inactiveSurveyReportsRef.current < 3 ||
                (Date.now() - lastSurveyActiveAtRef.current) < 5000
              ) {
                  return {
                    ...prev,
                    satelliteCount: preserveCount(data.gnss?.num_satellites, prev.satelliteCount),
                    currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
                    position: {
                      latitude: data.gnss?.latitude ?? prev.position.latitude,
                    longitude: data.gnss?.longitude ?? prev.position.longitude,
                    altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
                      accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
                    },
                    localCoordinates: wsLocalCoords,
                    valid: wsValid || prev.valid,
                  };
                }
              }

            return {
              ...prev,
              elapsedTime: wsActive ? nextActiveElapsed : Math.max(wsElapsed, prev.elapsedTime),
              progress: wsActive ? Math.min(nextActiveElapsed / Math.max(prev.requiredTime, 1), 1) : 1,
              satelliteCount: preserveCount(data.gnss?.num_satellites, prev.satelliteCount),
              currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
              position: {
                latitude: data.gnss?.latitude ?? prev.position.latitude,
                longitude: data.gnss?.longitude ?? prev.position.longitude,
                altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
                accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
              },
              localCoordinates: wsLocalCoords,
              isActive: wsActive,
              status: !wsActive ? 'completed' : prev.status,
              valid: wsValid || prev.valid,
            };
          }

          return prev;
        });

      } catch (e) {
        console.error("WebSocket parse error:", e);
      }
    };

    wsRef.current.onclose = () => {
      if (intentionalDisconnectRef.current) {
        intentionalDisconnectRef.current = false;
        setConnection((prev) => ({ ...prev, isConnected: false }));
      }
    };
  }, [addLog, lastSavedWsUrl, syncConfigurationFromBackend]);

  useEffect(() => {
    if (!survey.isActive) return;

    const timer = setInterval(() => {
      if (stoppingRef.current || !startInitiatedAtRef.current) {
        return;
      }

      const derivedElapsed = Math.max(0, Math.floor((Date.now() - startInitiatedAtRef.current) / 1000));

      setSurvey((prev) => {
        if (!prev.isActive) {
          return prev;
        }

        if (derivedElapsed <= prev.elapsedTime) {
          return prev;
        }

        return {
          ...prev,
          elapsedTime: derivedElapsed,
          progress: Math.min(derivedElapsed / Math.max(prev.requiredTime, 1), 1),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [survey.isActive]);

  useEffect(() => {
    const reconnectTimer = setInterval(() => {
      const wsDown = wsRef.current?.readyState !== WebSocket.OPEN;
      const surveyInactive = !survey.isActive;
      const notIntentionalDisconnect = !intentionalDisconnectRef.current;

      if (wsDown && surveyInactive && notIntentionalDisconnect && connection.isConnected) {
        connectWebSocket();
      }
    }, 5000);

    return () => clearInterval(reconnectTimer);
  }, [connectWebSocket, survey.isActive, connection.isConnected]);

  /* ================= START SURVEY ================= */
  const startSurvey = useCallback(async () => {
    try {
      const currentDuration = configuration.baseStation.surveyDuration;
      const currentAccuracy = configuration.baseStation.accuracyThreshold;
      const requestStartedAt = Date.now();
      const payload = getAutoFlowPayload();
      startPendingRef.current = true;
      startInitiatedAtRef.current = Date.now();
      inactiveSurveyReportsRef.current = 0;
      lastSurveyActiveAtRef.current = Date.now();
      hasSeenActiveRef.current = false;
      startupPollLogCountRef.current = 0;
      startupWsLogCountRef.current = 0;

      addLog('info', `Auto Flow start requested. WS=${getWsUrl() ?? 'unset'} API=${getApiHost() ?? 'unset'} duration=${currentDuration}s accuracy=${currentAccuracy}cm`);

      setSurvey((prev) => ({
        ...prev,
        isActive: false,
        valid: false,
        status: "initializing",
        progress: 0,
        elapsedTime: 0,
        targetAccuracy: currentAccuracy,
        requiredTime: currentDuration,
        currentAccuracy: 0,
      }));

      await api.startAutoFlow(payload);
      addLog('info', `Auto Flow start response received in ${Date.now() - requestStartedAt}ms`);
    } catch (error) {
      startPendingRef.current = false;
      setSurveyHistory((prev) => [{
        id: `SRV-ERR-${Date.now().toString().slice(-6)}`,
        timestamp: new Date(),
        duration: 0,
        finalAccuracy: 0,
        targetAccuracy: configuration.baseStation.accuracyThreshold,
        accuracyAttempts: [],
        coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
        localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
        success: false,
        eventType: 'error',
        message: `Hardware failed to initiate Auto Flow: ${String(error)}`
      } as any, ...prev]);

      addLog('error', `Auto Flow start failed: ${String(error)}`);
      setSurvey((prev) => ({ ...prev, isActive: false, status: "failed" }));
      throw error;
    }
  }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, addLog, getAutoFlowPayload]);

  /* ================= STOP SURVEY ================= */
  const stopSurvey = useCallback(async () => {
    try {
      addLog('info', 'Stopping Auto Flow');
      stoppingRef.current = true;
      startPendingRef.current = false;
      setSurvey((prev) => ({ ...prev, isActive: false, valid: false, status: 'stopped' }));

      let stopAttempts = 0;
      let stopSucceeded = false;
      const maxRetries = 2;

      while (stopAttempts < maxRetries && !stopSucceeded) {
        try {
          stopAttempts++;
          await api.stopAutoFlow();
          stopSucceeded = true;
          addLog('info', 'Auto Flow stopped successfully on backend');
        } catch (apiError) {
          if (stopAttempts < maxRetries) {
            addLog('warning', `Stop attempt ${stopAttempts}/${maxRetries} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            addLog('warning', `Auto Flow stop failed after ${maxRetries} attempts (UI stopped locally)`);
          }
        }
      }
    } catch (error) {
      addLog('error', `Unexpected Auto Flow stop error: ${String(error)}`);
      setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));
    } finally {
      setTimeout(() => {
        stoppingRef.current = false;
      }, 1000);
    }
  }, [addLog]);

/* ================= CONNECTION FUNCTIONS ================= */
  const connectToDevice = useCallback(async (type: "wifi" | "ble" | "auto", identifier: string, password?: string, wsUrl?: string) => {
    try {
      let finalWsUrl = wsUrl;

      if (type === 'auto') {
        addLog('info', 'Auto Mode: Attempting stealth ping...');
        if (lastSavedWsUrl) {
          const pingResult = await stealthPing(lastSavedWsUrl, 3000);
          if (pingResult) {
            addLog('info', 'Stealth ping successful!');
            finalWsUrl = pingResult;
          } else {
            addLog('warning', 'Stealth ping failed. Saved IP may have changed.');
            throw new Error('Connection rejected. The hardware IP may have changed.');
          }
        } else {
          addLog('warning', 'No saved connection. Manual WLAN sweep required.');
          throw new Error('No previous connection found. Please use the WLAN Socket tab first.');
        }
      }
      // Manual WiFi via discovered/manual WS URL: connect directly (no native WiFi join flow)
      else if (type === 'wifi' && finalWsUrl) {
        // finalWsUrl is already resolved by scanner/manual input
      }
      // Manual WiFi by raw IP string
      else if (type === 'wifi' && identifier && identifier !== 'CURRENT_WIFI' && !identifier.includes('WLAN')) {
        // Check if it looks like an IP address
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(identifier)) {
          addLog('info', `Validating manual IP: ${identifier}`);
          finalWsUrl = await validateManualIP(identifier);
          if (!finalWsUrl) {
            throw new Error(`IP validation failed: ${identifier}`);
          }
        } else {
          // Regular WiFi network - just connect
          await connectWifi(identifier, password);
        }
      } else if (type === 'wifi') {
        if (identifier && identifier !== 'CURRENT_WIFI') {
          await connectWifi(identifier, password);
        }
      } else if (type === 'ble') {
        await connectBle(identifier);
      }

      // ⭐ Update API host if we have a new WS URL
      if (finalWsUrl) {
        setApiHost(finalWsUrl);
      }

      // ⭐ Connect WebSocket with discovered URL
      const resolvedType = type === 'auto' ? 'wifi' : type;
      connectWebSocket(finalWsUrl);
      setConnection(prev => ({ ...prev, connectionType: resolvedType }));
      addLog('info', `Connecting via ${type}`);
    } catch (error) {
      addLog('error', `Connection failed: ${String(error)}`);
      throw error;
    }
  }, [connectWebSocket, lastSavedWsUrl, addLog]);

  // ⭐ THE MISSING DISCONNECT FUNCTION
  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    stoppingRef.current = false;
    startPendingRef.current = false;
    inactiveSurveyReportsRef.current = 0;
    setSurvey(prev => ({ ...prev, isActive: false, status: 'idle' }));
    setIsAutoFlowActive(false);
    wsRef.current?.close();
    setConnection(prev => ({ ...prev, isConnected: false, connectionType: 'none' })); // Force UI reset
    addLog('info', 'Disconnected from device');
  }, [addLog]);

  /* ================= STREAM FUNCTIONS ================= */
  const toggleStream = useCallback(async (key: keyof StreamState, enabled: boolean) => {
    try {
      addLog('info', `${enabled ? 'Enabling' : 'Disabling'} ${key} stream`);
    } catch (error) {
      addLog('error', `Stream toggle failed: ${String(error)}`);
      throw error;
    }
  }, [addLog]);

  /* ================= SCAN FUNCTIONS ================= */
  const scanWiFi = useCallback(async () => {
    try {
      const networks = await scanWifi();
      setAvailableWiFiNetworks(networks);
      addLog('info', `Found ${networks.length} WiFi networks`);
    } catch (error) {
      addLog('error', `WiFi scan failed: ${String(error)}`);
    }
  }, [addLog]);

  const scanBLE = useCallback(async () => {
    try {
      const devices = await scanBleDevices();
      setAvailableBLEDevices(devices);
      addLog('info', `Found ${devices.length} BLE devices`);
    } catch (error) {
      addLog('error', `BLE scan failed: ${String(error)}`);
    }
  }, [addLog]);

  /* ================= CONFIG & SETTINGS ================= */
  const updateConfiguration = useCallback((config: Configuration) => {
    setConfiguration(config);
    persistConfiguration(config);
    addLog('info', 'Configuration saved');
  }, [addLog, persistConfiguration]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);
  const exportHistoryCSV = useCallback(async () => {}, []);
  const exportLogsCSV = useCallback(async () => {}, []);

  /* ================= NTRIP FUNCTIONS ================= */
  const startNTRIP = useCallback(async (host: string, port: number, mountpoint: string, password: string, username?: string) => {
    try {
      addLog('info', `Starting NTRIP: ${host}:${port}/${mountpoint}`);
      setStreams((prev) => ({
        ...prev,
        ntrip: { ...prev.ntrip, enabled: true, active: false, mountpoint },
      }));
      await api.startNTRIP(host, port, mountpoint, password, username);
      setStreams((prev) => ({
        ...prev,
        ntrip: { ...prev.ntrip, active: true, mountpoint },
      }));
      setIsNtripUserArmed(true);
      addLog('info', 'NTRIP started successfully');
    } catch (error) {
      setIsNtripUserArmed(false);
      setStreams((prev) => ({
        ...prev,
        ntrip: { ...prev.ntrip, enabled: false, active: false },
      }));
      addLog('error', `NTRIP start failed: ${String(error)}`);
      throw error;
    }
  }, [addLog]);

  const stopNTRIP = useCallback(async () => {
    try {
      addLog('info', 'Stopping NTRIP');
      setIsNtripUserArmed(false);
      setStreams((prev) => ({
        ...prev,
        ntrip: { ...prev.ntrip, enabled: false, active: false, throughput: 0, uptime: 0, dataSent: 0, dataReceived: 0 },
      }));
      await api.stopNTRIP();
      addLog('info', 'NTRIP stopped successfully');
    } catch (error) {
      setIsNtripUserArmed(false);
      addLog('error', `NTRIP stop failed: ${String(error)}`);
      throw error;
    }
  }, [addLog]);

  /* ================= SURVEY STATUS POLL ================= */
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!connection.isConnected) return;

      try {
        const surveyStatus = await api.getStatusSurvey();
        if (startPendingRef.current && startupPollLogCountRef.current < 8) {
          startupPollLogCountRef.current += 1;
          addLog(
            'info',
            `Poll survey update ${startupPollLogCountRef.current}: active=${String(surveyStatus?.active ?? false)}, progress=${String(surveyStatus?.progress ?? 'null')}, accuracy=${String(surveyStatus?.accuracy ?? 'null')}`
          );
        }
        if (surveyStatus && !stoppingRef.current) {
          setSurvey((prev) => {
            const pollAccuracy = (surveyStatus.accuracy ?? 0) * 100;
            const pollElapsed = surveyStatus.observation_time ?? prev.elapsedTime;
            const pollActive = surveyStatus.active ?? prev.isActive;
            const pollValid = surveyStatus.valid ?? false;
            const nextActiveElapsed = Math.max(prev.elapsedTime, pollElapsed);
            const withinStartGrace =
              startPendingRef.current &&
              (prev.isActive || prev.status === "initializing") &&
              !pollActive &&
              (Date.now() - startInitiatedAtRef.current) < START_PENDING_GRACE_MS;
            
            const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
            const pos = surveyStatus.position || surveyStatus.local_position || {};
            
            const pollLocalCoords = {
              meanX: preserveCoordinate(parseVal(surveyStatus.ecef_x ?? surveyStatus.mean_x_m ?? surveyStatus.meanX ?? surveyStatus.x ?? pos.x ?? pos[0]), prev.localCoordinates.meanX),
              meanY: preserveCoordinate(parseVal(surveyStatus.ecef_y ?? surveyStatus.mean_y_m ?? surveyStatus.meanY ?? surveyStatus.y ?? pos.y ?? pos[1]), prev.localCoordinates.meanY),
              meanZ: preserveCoordinate(parseVal(surveyStatus.ecef_z ?? surveyStatus.mean_z_m ?? surveyStatus.meanZ ?? surveyStatus.z ?? pos.z ?? pos[2]), prev.localCoordinates.meanZ),
              observations: preserveCount(surveyStatus.observation_time, prev.localCoordinates.observations),
            };

            if (pollActive) {
              startPendingRef.current = false;
              inactiveSurveyReportsRef.current = 0;
              lastSurveyActiveAtRef.current = Date.now();
            }

            if (withinStartGrace) {
              return {
                ...prev,
                currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
                localCoordinates: pollLocalCoords,
                valid: pollValid || prev.valid,
              };
            }

            if (startPendingRef.current && !hasSeenActiveRef.current && !pollActive) {
              return {
                ...prev,
                status: "initializing",
                currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
                localCoordinates: pollLocalCoords,
                valid: pollValid || prev.valid,
              };
            }

            const shouldTreatInactiveAsFinal =
              hasSeenActiveRef.current &&
              !pollActive &&
              (
                pollValid ||
                pollElapsed >= prev.requiredTime ||
                (pollAccuracy > 0 && pollAccuracy <= prev.targetAccuracy)
              );

            if (!pollActive && prev.isActive && !shouldTreatInactiveAsFinal) {
              inactiveSurveyReportsRef.current += 1;
              if (
                inactiveSurveyReportsRef.current < 3 ||
                (Date.now() - lastSurveyActiveAtRef.current) < 5000
              ) {
                return {
                  ...prev,
                  currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
                  localCoordinates: pollLocalCoords,
                  valid: pollValid || prev.valid,
                };
              }
            }

            return {
              ...prev,
              elapsedTime: pollActive
                ? nextActiveElapsed
                : Math.max(pollElapsed, prev.elapsedTime),
              progress: Number.isFinite(Number(surveyStatus.progress))
                ? Math.min(Number(surveyStatus.progress) / 100, 1)
                : pollActive
                ? Math.min(nextActiveElapsed / Math.max(prev.requiredTime, 1), 1)
                : 1,
              currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
              isActive: pollActive,
              localCoordinates: pollLocalCoords,
              status: pollActive || surveyStatus.in_progress ? "in-progress" : (prev.isActive && !pollActive ? "completed" : prev.status),
              valid: pollValid || prev.valid,
            };
          });
        }
      } catch (e) {
        console.warn("Survey status poll failed:", e);
      }
    }, survey.isActive || survey.status === "initializing" ? 2000 : 5000);

    return () => clearInterval(pollInterval);
  }, [survey.isActive, survey.status, connection.isConnected]);

  /* ================= POSITION STATUS POLL ================= */
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!connection.isConnected) return;

      try {
        const positionStatus = await api.getStatusPosition();
        if (!positionStatus) return;

        const satelliteCount = Number(positionStatus.num_satellites ?? 0);
        const horizontalAccuracyM = Number(positionStatus.accuracy ?? 0);

        setGNSSStatus((prev) => ({
          ...prev,
          satellites: satelliteCount > 0
            ? Array.from({ length: satelliteCount }, (_, i) => ({
                id: i,
                constellation: "GPS",
                elevation: 0,
                azimuth: 0,
                snr: 0,
                used: true,
              }))
            : prev.satellites,
          fixType: positionStatus.fix_type_str ?? prev.fixType,
          dop: {
            ...prev.dop,
            pdop: preserveOptionalNumber(positionStatus.pdop, prev.dop.pdop),
          },
          lastUpdate: new Date(),
          globalPosition: {
            latitude: preserveCoordinate(positionStatus.latitude, prev.globalPosition.latitude),
            longitude: preserveCoordinate(positionStatus.longitude, prev.globalPosition.longitude),
            altitude: preserveCoordinate(positionStatus.altitude, prev.globalPosition.altitude),
            horizontalAccuracy: preserveCount(horizontalAccuracyM, prev.globalPosition.horizontalAccuracy),
          },
        }));

        setSurvey((prev) => ({
          ...prev,
          satelliteCount: preserveCount(satelliteCount, prev.satelliteCount),
          position: {
            ...prev.position,
            latitude: preserveCoordinate(positionStatus.latitude, prev.position.latitude),
            longitude: preserveCoordinate(positionStatus.longitude, prev.position.longitude),
            altitude: preserveCoordinate(positionStatus.altitude, prev.position.altitude),
            accuracy: horizontalAccuracyM > 0 ? horizontalAccuracyM : prev.position.accuracy,
          },
        }));
      } catch (e) {
        console.warn("Position status poll failed:", e);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [connection.isConnected]);

  /* ================= UNIFIED SURVEY LIFECYCLE WATCHER ================= */
  const prevIsActive = useRef(survey.isActive);
  
  useEffect(() => {
    if (prevIsActive.current === false && survey.isActive === true) {
      setSurveyHistory((prev) => [{
        id: `SRV-START-${Date.now().toString().slice(-6)}`,
        timestamp: new Date(),
        duration: 0,
        finalAccuracy: 0,
        targetAccuracy: survey.targetAccuracy,
        accuracyAttempts: [],
        coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
        localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
        success: true,
        eventType: 'started',
        message: `Survey sequence initialized. Target: ${survey.targetAccuracy}cm`
      } as any, ...prev]);
    }

    if (prevIsActive.current === true && survey.isActive === false) {
      startPendingRef.current = false;
      
      if (survey.elapsedTime < 2 && survey.currentAccuracy === 0 && !stoppingRef.current) {
        console.warn("Ignored ghost state transition (API Polling lag)");
      } 
      else if (stoppingRef.current) {
        setSurveyHistory((prev) => [{
          id: `SRV-STOP-${Date.now().toString().slice(-6)}`,
          timestamp: new Date(),
          duration: survey.elapsedTime,
          finalAccuracy: survey.currentAccuracy,
          targetAccuracy: survey.targetAccuracy,
          accuracyAttempts: [],
          coordinates: { ...survey.position },
          localCoordinates: { ...survey.localCoordinates },
          success: false,
          eventType: 'stopped',
          message: 'Survey manually halted by operator.'
        } as any, ...prev]);
      } 
      else {
        const isSuccess = survey.valid || (survey.currentAccuracy <= survey.targetAccuracy && survey.currentAccuracy > 0);
        
        setSurveyHistory((prev) => [{
          id: `SRV-${isSuccess ? 'COMP' : 'ERR'}-${Date.now().toString().slice(-6)}`,
          timestamp: new Date(),
          duration: survey.elapsedTime,
          finalAccuracy: survey.currentAccuracy,
          targetAccuracy: survey.targetAccuracy,
          accuracyAttempts: [],
          coordinates: { ...survey.position },
          localCoordinates: { ...survey.localCoordinates },
          success: isSuccess,
          eventType: isSuccess ? 'completed' : 'error',
          message: isSuccess ? 'Hardware reported successful convergence.' : 'Survey terminated without reaching target constraints.'
        } as any, ...prev]);

        addLog(isSuccess ? 'info' : 'warning', `Survey convergence complete. Accuracy: ${survey.currentAccuracy.toFixed(2)}cm`);
      }
    }
    
    prevIsActive.current = survey.isActive;
  }, [survey.isActive, survey.currentAccuracy, survey.targetAccuracy, survey.elapsedTime, survey.position, survey.localCoordinates, addLog]);

  /* ================= NTRIP STATUS POLL ================= */
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!connection.isConnected) return;
      try {
        const ntripStatus = await api.getNTRIP();
        if (ntripStatus) {
          const nextBytesSent = Number(ntripStatus.bytes_sent ?? 0);
          const nextUptime = Number(ntripStatus.uptime ?? 0);
          const now = Date.now();
          const previousSample = lastNtripSampleRef.current;

          let computedThroughput = 0;
          if (
            previousSample &&
            nextBytesSent >= previousSample.bytesSent &&
            now > previousSample.at
          ) {
            const elapsedSeconds = (now - previousSample.at) / 1000;
            if (elapsedSeconds > 0) {
              computedThroughput = (nextBytesSent - previousSample.bytesSent) / elapsedSeconds;
            }
          }

          lastNtripSampleRef.current = { bytesSent: nextBytesSent, at: now };

          setStreams((prev) => ({
            ...prev,
            ntrip: {
              ...prev.ntrip,
              enabled: ntripStatus.enabled ?? false,
              active: ntripStatus.connected ?? false,
              throughput: computedThroughput,
              mountpoint: ntripStatus.mountpoint ?? prev.ntrip.mountpoint,
              uptime: nextUptime,
              dataSent: nextBytesSent,
              dataReceived: Number(ntripStatus.bytes_received ?? prev.ntrip.dataReceived ?? 0),
              lastError: ntripStatus.error_message ?? null,
            },
          }));
        }
      } catch (e) {
        console.warn("NTRIP status poll failed:", e);
      }
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [connection.isConnected]);

  /* ================= CONFIG SYNC ================= */
  useEffect(() => {
    if (survey.isActive) {
      setSurvey((prev) => ({
        ...prev,
        requiredTime: configuration.baseStation.surveyDuration,
        targetAccuracy: configuration.baseStation.accuracyThreshold,
      }));
    }
  }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, survey.isActive]);

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(
    () => ({
      connection,
      connectToDevice,
      disconnect,
      survey,
      startSurvey,
      stopSurvey,
      isAutoFlowActive,
      gnssStatus,
      streams,
      toggleStream,
      configuration,
      updateConfiguration,
      settings,
      updateSettings,
      availableWiFiNetworks,
      availableBLEDevices,
      scanWiFi,
      scanBLE,
      surveyHistory,
      logs,
      addLog,
      clearLogs,
      deleteLogs,
      clearSurveyHistory,
      deleteSurveys,
      exportHistoryCSV,
      exportLogsCSV,
      startNTRIP,
      stopNTRIP,
    }),
    [connection, survey, isAutoFlowActive, gnssStatus, streams, configuration, settings, surveyHistory, logs, connectToDevice, disconnect, startSurvey, stopSurvey, toggleStream, updateConfiguration, updateSettings, scanWiFi, scanBLE, addLog, clearLogs, deleteLogs, clearSurveyHistory, deleteSurveys, exportHistoryCSV, exportLogsCSV, startNTRIP, stopNTRIP]
  );

  return (
    <GNSSContext.Provider value={value}>
      {children}
    </GNSSContext.Provider>
  );
};
