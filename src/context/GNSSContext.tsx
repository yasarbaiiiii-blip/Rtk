// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   useCallback,
// } from "react";


// import {
//   ConnectionState,
//   SurveyState,
//   GNSSStatus,
//   StreamState,
//   Configuration,
//   WiFiNetwork,
//   BLEDevice,
//   LogEntry,
//   SurveyHistoryEntry,
//   AppSettings,
//   Satellite,
// } from "../types/gnss";

// import { api, WS_URL } from "../api/gnssApi";
// import { scanWifi, connectWifi } from "../native/wifi";
// import { uiLogger } from "../utils/uiLogger";

// /* ================= CONTEXT TYPE ================= */

// type GNSSContextType = {
//   connection: ConnectionState;
//   connectToDevice: (type: "wifi" | "ble", identifier: string, password?: string) => Promise<void>;
//   disconnect: () => void;
//   survey: SurveyState;
//   startSurvey: () => Promise<void>;
//   stopSurvey: () => Promise<void>;
//   isAutoFlowActive: boolean;
//   gnssStatus: GNSSStatus;
//   streams: StreamState;
//   toggleStream: (key: keyof StreamState, enabled: boolean) => Promise<void>;
//   configuration: Configuration;
//   updateConfiguration: (config: Configuration) => void;
//   settings: AppSettings;
//   updateSettings: (patch: Partial<AppSettings>) => void;
//   availableWiFiNetworks: WiFiNetwork[];
//   availableBLEDevices: BLEDevice[];
//   scanWiFi: () => Promise<void>;
//   scanBLE: () => Promise<void>;
//   surveyHistory: SurveyHistoryEntry[];
//   logs: LogEntry[];
//   addLog: (level: 'error' | 'warning' | 'info', message: string) => void;
//   clearLogs: () => void;
//   exportHistoryCSV: () => Promise<void>;
//   exportLogsCSV: () => Promise<void>;
//   startNTRIP: (host: string, port: number, mountpoint: string, password: string, username?: string) => Promise<void>;
//   stopNTRIP: () => Promise<void>;
// };

// const GNSSContext = createContext<GNSSContextType | null>(null);

// export const useGNSS = () => {
//   const ctx = useContext(GNSSContext);
//   if (!ctx) throw new Error("useGNSS must be used inside GNSSProvider");
//   return ctx;
// };

// /* ================= PROVIDER ================= */

// export const GNSSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const wsRef = useRef<WebSocket | null>(null);
//   const stoppingRef = useRef(false);
//   const intentionalDisconnectRef = useRef(false);

//   /* ================= STATE ================= */

//   const [connection, setConnection] = useState<ConnectionState>({
//     connectionType: "none",
//     isConnected: false,
//     lastConnectedTimestamp: null,
//     signalStrength: 0,
//     latency: 0,
//     autoReconnect: true,
//   });

//   const [survey, setSurvey] = useState<SurveyState>({
//     surveyMode: "survey-in",
//     isActive: false,
//     valid: false,
//     progress: 0,
//     elapsedTime: 0,
//     requiredTime: 30,
//     currentAccuracy: 0,
//     targetAccuracy: 200,
//     position: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
//     localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
//     status: "idle",
//     satelliteCount: 0,
//   });

//   const [isAutoFlowActive, setIsAutoFlowActive] = useState(false);

//   const [gnssStatus, setGNSSStatus] = useState<GNSSStatus>({
//     satellites: [],
//     fixType: "none",
//     dop: { hdop: null, vdop: null, pdop: null },
//     updateRate: 1,
//     lastUpdate: new Date(),
//     firmwareVersion: "unknown",
//     activeConstellations: [],
//     globalPosition: { latitude: 0, longitude: 0, altitude: 0, horizontalAccuracy: 0 },
//   });

//   const defaultStream = { enabled: false, active: false, throughput: 0, messageRate: 0 };
//   const [streams, setStreams] = useState<StreamState>({
//     serial: { ...defaultStream },
//     ntrip: { ...defaultStream, mountpoint: "", uptime: 0, dataSent: 0, lastError: null },
//     tcp: { ...defaultStream, connectedClients: 0 },
//     udp: { ...defaultStream },
//   });

//   const [availableWiFiNetworks, setAvailableWiFiNetworks] = useState<WiFiNetwork[]>([]);
//   const [availableBLEDevices, setAvailableBLEDevices] = useState<BLEDevice[]>([]);
//   const [surveyHistory, setSurveyHistory] = useState<SurveyHistoryEntry[]>([]);
//   const [logs, setLogs] = useState<LogEntry[]>([]);

//   /* ================= PERSISTED DEFAULTS ================= */
//   const DEFAULT_CONFIG: Configuration = {
//     baseStation: {
//       surveyDuration: 120,
//       accuracyThreshold: 200,
//       autoStart: false,
//       autoMode: false,
//       fixedMode: { enabled: false, coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 } },
//     },
//     streams: {
//       ntrip: { server: "caster.emlid.com", port: 2101, mountpoint: "", username: "", password: "" },
//       serial: { baudRate: 115200, messages: [], rates: [] },
//       tcp: { port: 9000, maxClients: 5, authEnabled: false },
//       udp: { port: 8001, broadcastAddress: "", multicast: false },
//     },
//     system: { wifiSsid: "", wifiPassword: "", ledMode: "status", ledBrightness: 80 },
//   };

//   const DEFAULT_SETTINGS: AppSettings = {
//     units: { distance: "meters", coordinates: "DD" },
//     theme: "system",
//     language: "en",
//     notifications: { surveyCompletion: true, connectionLoss: true, lowAccuracy: true, sound: true, vibration: true },
//     connection: { preferredMethod: "auto", autoReconnect: true, timeout: 10, keepScreenAwake: true },
//   };

//   const loadPersistedConfig = (): Configuration => {
//     try {
//       const saved = localStorage.getItem('gnss_configuration');
//       if (saved) {
//         const parsed = JSON.parse(saved) as Configuration;
//         // Deep merge with defaults so newly added fields always exist
//         return {
//           ...DEFAULT_CONFIG,
//           ...parsed,
//           baseStation: {
//             ...DEFAULT_CONFIG.baseStation, ...parsed.baseStation,
//             fixedMode: {
//               ...DEFAULT_CONFIG.baseStation.fixedMode, ...parsed.baseStation?.fixedMode,
//               coordinates: { ...DEFAULT_CONFIG.baseStation.fixedMode.coordinates, ...parsed.baseStation?.fixedMode?.coordinates },
//             },
//           },
//           streams: {
//             ...DEFAULT_CONFIG.streams, ...parsed.streams,
//             ntrip: { ...DEFAULT_CONFIG.streams.ntrip, ...parsed.streams?.ntrip },
//             serial: { ...DEFAULT_CONFIG.streams.serial, ...parsed.streams?.serial },
//             tcp: { ...DEFAULT_CONFIG.streams.tcp, ...parsed.streams?.tcp },
//             udp: { ...DEFAULT_CONFIG.streams.udp, ...parsed.streams?.udp },
//           },
//           system: { ...DEFAULT_CONFIG.system, ...parsed.system },
//         };
//       }
//     } catch (e) {
//       console.warn('Failed to load saved configuration, using defaults:', e);
//     }
//     return DEFAULT_CONFIG;
//   };

//   const loadPersistedSettings = (): AppSettings => {
//     try {
//       const saved = localStorage.getItem('gnss_settings');
//       if (saved) {
//         const parsed = JSON.parse(saved) as AppSettings;
//         return {
//           ...DEFAULT_SETTINGS,
//           ...parsed,
//           units: { ...DEFAULT_SETTINGS.units, ...parsed.units },
//           notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
//           connection: { ...DEFAULT_SETTINGS.connection, ...parsed.connection },
//         };
//       }
//     } catch (e) {
//       console.warn('Failed to load saved settings, using defaults:', e);
//     }
//     return DEFAULT_SETTINGS;
//   };

//   const [configuration, setConfiguration] = useState<Configuration>(loadPersistedConfig);

//   const [settings, setSettings] = useState<AppSettings>(loadPersistedSettings);


//   /* ================= HELPER FUNCTIONS ================= */

//   // Poll autoflow config every 5s — keeps UI toggle in sync with backend
//   useEffect(() => {
//     const syncAutoMode = () => {
//       api.getAutoFlowConfig()
//         .then((cfg) => {
//           if (typeof cfg.enabled === 'boolean') {
//             setConfiguration(prev => {
//               if (prev.baseStation.autoMode === cfg.enabled) return prev; // no change
//               const updated = {
//                 ...prev,
//                 baseStation: { ...prev.baseStation, autoMode: cfg.enabled },
//               };
//               localStorage.setItem('gnss_configuration', JSON.stringify(updated));
//               return updated;
//             });
//           }
//         })
//         .catch(() => { }); // silent — poll will retry
//     };

//     syncAutoMode(); // immediate first fetch
//     const interval = setInterval(syncAutoMode, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const addLog = useCallback((level: 'error' | 'warning' | 'info', message: string) => {
//     setLogs((prev) => [{ id: Date.now().toString(), timestamp: new Date(), level, message }, ...prev].slice(0, 500));
//   }, []);

//   /* ================= WEBSOCKET ================= */

//   const connectWebSocket = useCallback(() => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) return;

//     wsRef.current = new WebSocket(WS_URL);

//     wsRef.current.onopen = () => {
//       setConnection((prev) => ({ ...prev, isConnected: true, lastConnectedTimestamp: new Date() }));
//       addLog('info', 'WebSocket connected');
//     };

//     wsRef.current.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);

//         const satellites: Satellite[] = Array.from(
//           { length: data.gnss?.num_satellites || 0 },
//           (_, i) => ({ id: i, constellation: "GPS", elevation: 0, azimuth: 0, snr: 0, used: true })
//         );

//         setGNSSStatus({
//           satellites,
//           fixType: data.gnss?.fix_type ?? "none",
//           dop: { hdop: data.gnss?.hdop ?? null, vdop: data.gnss?.vdop ?? null, pdop: data.gnss?.pdop ?? null },
//           updateRate: data.gnss?.update_rate_hz ?? 1,
//           lastUpdate: new Date(),
//           firmwareVersion: data.system?.firmware_version ?? "unknown",
//           activeConstellations: ["GPS"],
//           globalPosition: {
//             latitude: data.gnss?.latitude ?? 0,
//             longitude: data.gnss?.longitude ?? 0,
//             altitude: data.gnss?.altitude_msl ?? 0,
//             horizontalAccuracy: data.gnss?.horizontal_accuracy ?? 0,
//           },
//         });

//         if (data.autoflow !== undefined) {
//           setIsAutoFlowActive(data.autoflow.active ?? false);
//         }

//         setSurvey((prev) => {
//           const wsActive = data.survey?.active ?? false;

//           if (prev.isActive !== wsActive) {
//             console.log(`🔄 Survey State Changed: active=${prev.isActive} -> ${wsActive}`, data.survey);
//           }


//           if (stoppingRef.current) {
//             return prev;
//           }

//           if (data.survey) {
//             console.log("📡 WS Survey Data:", JSON.stringify(data.survey));
//           }

//           const wsAccuracy = (data.survey?.accuracy_m ?? 0) * 100;

//           if (wsActive && !prev.isActive) {
//             return {
//               ...prev,
//               isActive: true,
//               status: "in-progress",
//               elapsedTime: data.survey?.progress_seconds ?? 0,
//               currentAccuracy: wsAccuracy,
//               satelliteCount: data.gnss?.num_satellites ?? 0,
//             };
//           }

//           if (prev.isActive) {
//             const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;
//             return {
//               ...prev,
//               satelliteCount: data.gnss?.num_satellites ?? prev.satelliteCount,
//               currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
//               position: {
//                 latitude: data.gnss?.latitude ?? prev.position.latitude,
//                 longitude: data.gnss?.longitude ?? prev.position.longitude,
//                 altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
//                 accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
//               },
//               isActive: wsActive,
//               status: !wsActive ? 'stopped' : prev.status,
//             };
//           }

//           return prev;
//         });

//       } catch (e) {
//         console.error("WebSocket parse error:", e);
//       }
//     };

//     wsRef.current.onclose = () => {
//       if (intentionalDisconnectRef.current) {
//         intentionalDisconnectRef.current = false;
//         setConnection((prev) => ({ ...prev, isConnected: false }));
//       }
//     };
//   }, [addLog]);

//   useEffect(() => {
//     connectWebSocket();

//     const reconnectTimer = setInterval(() => {
//       const wsDown = wsRef.current?.readyState !== WebSocket.OPEN;
//       const surveyInactive = !survey.isActive;
//       const notIntentionalDisconnect = !intentionalDisconnectRef.current;

//       if (wsDown && surveyInactive && notIntentionalDisconnect && connection.isConnected) {
//         connectWebSocket();
//       }
//     }, 5000);

//     return () => clearInterval(reconnectTimer);
//   }, [connectWebSocket, survey.isActive, connection.isConnected]);

//   /* ================= START SURVEY ================= */
//   const startSurvey = useCallback(async () => {
//     try {
//       const currentDuration = configuration.baseStation.surveyDuration;
//       const currentAccuracy = configuration.baseStation.accuracyThreshold;

//       setSurvey((prev) => ({
//         ...prev,
//         isActive: true,
//         status: "initializing",
//         progress: 0,
//         elapsedTime: 0,
//         targetAccuracy: currentAccuracy,
//         requiredTime: currentDuration,
//         currentAccuracy: 0,
//       }));

//       await api.startSurvey(currentDuration, currentAccuracy / 100);
//       addLog('info', 'Survey started successfully');
//     } catch (error) {
//       addLog('error', `Survey start failed: ${String(error)}`);
//       setSurvey((prev) => ({ ...prev, isActive: false, status: "failed" }));
//       throw error;
//     }
//   }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, addLog]);

//   /* ================= STOP SURVEY ================= */
//   const stopSurvey = useCallback(async () => {
//     try {
//       addLog('info', 'Stopping survey');
//       stoppingRef.current = true;
//       setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));

//       let stopAttempts = 0;
//       let stopSucceeded = false;
//       const maxRetries = 2;

//       while (stopAttempts < maxRetries && !stopSucceeded) {
//         try {
//           stopAttempts++;
//           await api.stopSurvey();
//           stopSucceeded = true;
//           addLog('info', 'Survey stopped successfully on backend');
//         } catch (apiError) {
//           if (stopAttempts < maxRetries) {
//             console.warn(`Stop attempt ${stopAttempts}/${maxRetries} failed, retrying...`, apiError);
//             addLog('warning', `Stop attempt ${stopAttempts}/${maxRetries} failed, retrying...`);
//             await new Promise(resolve => setTimeout(resolve, 500));
//           } else {
//             console.warn(`All ${maxRetries} stop attempts failed:`, apiError);
//             addLog('warning', `Backend stop failed after ${maxRetries} attempts (UI stopped locally)`);
//           }
//         }
//       }

//       const historyEntry: SurveyHistoryEntry = {
//         id: `survey_${Date.now()}`,
//         timestamp: new Date(),
//         duration: survey.elapsedTime,
//         finalAccuracy: survey.currentAccuracy,
//         targetAccuracy: survey.targetAccuracy,
//         accuracyAttempts: [],
//         coordinates: survey.position,
//         success: survey.currentAccuracy <= survey.targetAccuracy,
//       };
//       setSurveyHistory((prev) => [historyEntry, ...prev]);

//     } catch (error) {
//       console.error("Unexpected error during survey stop:", error);
//       addLog('error', `Unexpected survey stop error: ${String(error)}`);
//       setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));
//     } finally {
//       setTimeout(() => {
//         stoppingRef.current = false;
//       }, 1000);
//     }
//   }, [survey.elapsedTime, survey.targetAccuracy, survey.position, addLog]);

//   /* ================= CONNECTION FUNCTIONS ================= */
//   const connectToDevice = useCallback(async (type: "wifi" | "ble", identifier: string, password?: string) => {
//     try {
//       if (type === "wifi") await connectWifi(identifier, password);
//       connectWebSocket();
//       setConnection(prev => ({ ...prev, isConnected: true, connectionType: type }));
//       addLog('info', `Connected via ${type}`);
//     } catch (error) {
//       addLog('error', `Connection failed: ${String(error)}`);
//       throw error;
//     }
//   }, [connectWebSocket, addLog]);

//   const disconnect = useCallback(() => {
//     intentionalDisconnectRef.current = true;
//     stoppingRef.current = false;
//     setSurvey(prev => ({ ...prev, isActive: false, status: 'idle' }));
//     setIsAutoFlowActive(false);
//     wsRef.current?.close();
//     addLog('info', 'Disconnected from device');
//   }, [addLog]);

//   /* ================= STREAM FUNCTIONS ================= */
//   const toggleStream = useCallback(async (key: keyof StreamState, enabled: boolean) => {
//     try {
//       addLog('info', `${enabled ? 'Enabling' : 'Disabling'} ${key} stream`);
//     } catch (error) {
//       addLog('error', `Stream toggle failed: ${String(error)}`);
//       throw error;
//     }
//   }, [addLog]);

//   /* ================= SCAN FUNCTIONS ================= */
//   const scanWiFi = useCallback(async () => {
//     try {
//       const networks = await scanWifi();
//       setAvailableWiFiNetworks(networks);
//       addLog('info', `Found ${networks.length} WiFi networks`);
//     } catch (error) {
//       addLog('error', `WiFi scan failed: ${String(error)}`);
//     }
//   }, [addLog]);

//   const scanBLE = useCallback(async () => {
//     try {
//       addLog('info', 'BLE scan started');
//     } catch (error) {
//       addLog('error', `BLE scan failed: ${String(error)}`);
//     }
//   }, [addLog]);

//   /* ================= CONFIG & SETTINGS ================= */
//   const updateConfiguration = useCallback((config: Configuration) => {
//     setConfiguration(config);
//     try {
//       localStorage.setItem('gnss_configuration', JSON.stringify(config));
//     } catch (e) {
//       console.warn('Failed to save configuration:', e);
//     }
//     addLog('info', 'Configuration saved');
//   }, [addLog]);

//   const updateSettings = useCallback((patch: Partial<AppSettings>) => {
//     setSettings((prev) => {
//       const next = { ...prev, ...patch };
//       try {
//         localStorage.setItem('gnss_settings', JSON.stringify(next));
//       } catch (e) {
//         console.warn('Failed to save settings:', e);
//       }
//       return next;
//     });
//   }, []);

//   const clearLogs = useCallback(() => {
//     setLogs([]);
//   }, []);

//   const exportHistoryCSV = useCallback(async () => {
//     // TODO: Implement
//   }, []);

//   const exportLogsCSV = useCallback(async () => {
//     // TODO: Implement
//   }, []);



//   /* ================= NTRIP FUNCTIONS ================= */
//   const startNTRIP = useCallback(async (host: string, port: number, mountpoint: string, password: string, username?: string) => {
//     try {
//       addLog('info', `Starting NTRIP: ${host}:${port}/${mountpoint}`);
//       // Optimistic update so the status block and button flip instantly
//       setStreams((prev) => ({
//         ...prev,
//         ntrip: {
//           ...prev.ntrip,
//           enabled: true,
//           active: true,
//           mountpoint,
//         },
//       }));
//       await api.startNTRIP(host, port, mountpoint, password, username);
//       addLog('info', 'NTRIP started successfully');
//     } catch (error) {
//       // Rollback optimistic update on failure
//       setStreams((prev) => ({
//         ...prev,
//         ntrip: { ...prev.ntrip, enabled: false, active: false },
//       }));
//       addLog('error', `NTRIP start failed: ${String(error)}`);
//       throw error;
//     }
//   }, [addLog]);

//   const stopNTRIP = useCallback(async () => {
//     try {
//       addLog('info', 'Stopping NTRIP');
//       // Optimistic update
//       setStreams((prev) => ({
//         ...prev,
//         ntrip: {
//           ...prev.ntrip,
//           enabled: false,
//           active: false,
//           throughput: 0,
//           uptime: 0,
//           dataSent: 0,
//         },
//       }));
//       await api.stopNTRIP();
//       addLog('info', 'NTRIP stopped successfully');
//     } catch (error) {
//       addLog('error', `NTRIP stop failed: ${String(error)}`);
//       throw error;
//     }
//   }, [addLog]);


//   /* ================= AUTO-COMPLETION: Backend handles via 'active: false' ================= */
//   /* No need to manually stop survey - backend sets active:false when time/accuracy limit met */

//   /* ================= SURVEY TIMER ================= */
//   useEffect(() => {
//     if (!survey.isActive) return;

//     const surveyInterval = setInterval(() => {
//       setSurvey((prev) => {
//         const newElapsedTime = prev.elapsedTime + 1;
//         const progress = Math.min(newElapsedTime / prev.requiredTime, 1);
//         return { ...prev, elapsedTime: newElapsedTime, progress };
//       });
//     }, 1000);

//     return () => clearInterval(surveyInterval);
//   }, [survey.isActive]);

//   /* ================= SURVEY STATUS POLL ================= */
//   useEffect(() => {
//     if (!survey.isActive) return;

//     const pollInterval = setInterval(async () => {
//       try {
//         const surveyStatus = await api.getSurveyStatus();
//         console.log("🔍 Survey Status Poll [/survey/status]:", JSON.stringify(surveyStatus, null, 2));
//         if (surveyStatus && !stoppingRef.current) {
//           setSurvey((prev) => {
//             // Don't update if survey is completed
//             if (prev.status === 'completed') return prev;

//             const pollAccuracy = (surveyStatus.accuracy_m ?? 0) * 100;
//             return {
//               ...prev,
//               elapsedTime: surveyStatus.progress_seconds ?? prev.elapsedTime,
//               currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
//               isActive: surveyStatus.active ?? prev.isActive,
//             };
//           });
//         }
//       } catch (e) {
//         console.warn("Survey status poll failed:", e);
//       }
//     }, 2000);

//     return () => clearInterval(pollInterval);
//   }, [survey.isActive]);

//   /* ================= NTRIP STATUS POLL ================= */
//   useEffect(() => {
//     const pollInterval = setInterval(async () => {
//       try {
//         const ntripStatus = await api.getNTRIP();
//         console.log("🔍 NTRIP Status Poll [/ntrip]:", JSON.stringify(ntripStatus, null, 2));

//         if (ntripStatus) {
//           setStreams((prev) => ({
//             ...prev,
//             ntrip: {
//               ...prev.ntrip,
//               enabled: ntripStatus.enabled ?? false,
//               active: ntripStatus.connected ?? false,
//               throughput: ntripStatus.data_rate_bps ?? 0,
//               messageRate: 0, // NTRIP doesn't have message rate in the response
//               mountpoint: ntripStatus.mountpoint ?? prev.ntrip.mountpoint,
//               uptime: ntripStatus.uptime_seconds ?? 0,
//               dataSent: ntripStatus.bytes_sent ?? 0,
//               lastError: null, // Could be enhanced if backend provides error info
//             },
//           }));
//         }
//       } catch (e) {
//         console.warn("NTRIP status poll failed:", e);
//       }
//     }, 2000);

//     return () => clearInterval(pollInterval);
//   }, []);

//   /* ================= AUTO MODE ================= */
//   useEffect(() => {
//     if (configuration.baseStation.autoMode && !survey.isActive && connection.isConnected && !stoppingRef.current) {
//       const timer = setTimeout(() => {
//         startSurvey().catch(err => {
//           console.error("Auto start failed", err);
//           addLog('error', `Auto start failed: ${String(err)}`);
//         });
//       }, 500);
//       return () => clearTimeout(timer);
//     }
//   }, [configuration.baseStation.autoMode, connection.isConnected, survey.isActive, startSurvey, addLog]);

//   /* ================= CONFIG SYNC ================= */
//   useEffect(() => {
//     if (survey.isActive) {
//       setSurvey((prev) => ({
//         ...prev,
//         requiredTime: configuration.baseStation.surveyDuration,
//         targetAccuracy: configuration.baseStation.accuracyThreshold,
//       }));
//     }
//   }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, survey.isActive]);

//   /* ================= CONTEXT VALUE ================= */

//   const value = useMemo(
//     () => ({
//       connection,
//       connectToDevice,
//       disconnect,
//       survey,
//       startSurvey,
//       stopSurvey,
//       isAutoFlowActive,
//       gnssStatus,
//       streams,
//       toggleStream,
//       configuration,
//       updateConfiguration,
//       settings,
//       updateSettings,
//       availableWiFiNetworks,
//       availableBLEDevices,
//       scanWiFi,
//       scanBLE,
//       surveyHistory,
//       logs,
//       addLog,
//       clearLogs,
//       exportHistoryCSV,
//       exportLogsCSV,
//       startNTRIP,
//       stopNTRIP,
//     }),
//     [connection, survey, isAutoFlowActive, gnssStatus, streams, configuration, settings, surveyHistory, logs, connectToDevice, disconnect, startSurvey, stopSurvey, toggleStream, updateConfiguration, updateSettings, scanWiFi, scanBLE, addLog, clearLogs, exportHistoryCSV, exportLogsCSV, startNTRIP, stopNTRIP]
//   );

//   return (
//     <GNSSContext.Provider value={value}>
//       {children}
//     </GNSSContext.Provider>
//   );
// };





























































// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   useCallback,
// } from "react";

// import {
//   ConnectionState,
//   SurveyState,
//   GNSSStatus,
//   StreamState,
//   Configuration,
//   WiFiNetwork,
//   BLEDevice,
//   LogEntry,
//   SurveyHistoryEntry,
//   AppSettings,
//   Satellite,
// } from "../types/gnss";

// import { api, WS_URL } from "../api/gnssApi";
// import { scanWifi, connectWifi } from "../native/wifi";
// import { uiLogger } from "../utils/uiLogger";

// /* ================= CONTEXT TYPE ================= */

// type GNSSContextType = {
//   connection: ConnectionState;
//   connectToDevice: (type: "wifi" | "ble", identifier: string, password?: string) => Promise<void>;
//   disconnect: () => void;
//   survey: SurveyState;
//   startSurvey: () => Promise<void>;
//   stopSurvey: () => Promise<void>;
//   isAutoFlowActive: boolean;
//   gnssStatus: GNSSStatus;
//   streams: StreamState;
//   toggleStream: (key: keyof StreamState, enabled: boolean) => Promise<void>;
//   configuration: Configuration;
//   updateConfiguration: (config: Configuration) => void;
//   settings: AppSettings;
//   updateSettings: (patch: Partial<AppSettings>) => void;
//   availableWiFiNetworks: WiFiNetwork[];
//   availableBLEDevices: BLEDevice[];
//   scanWiFi: () => Promise<void>;
//   scanBLE: () => Promise<void>;
//   surveyHistory: SurveyHistoryEntry[];
//   logs: LogEntry[];
//   addLog: (level: 'error' | 'warning' | 'info', message: string) => void;
//   clearLogs: () => void;
//   exportHistoryCSV: () => Promise<void>;
//   exportLogsCSV: () => Promise<void>;
//   startNTRIP: (host: string, port: number, mountpoint: string, password: string, username?: string) => Promise<void>;
//   stopNTRIP: () => Promise<void>;
// };

// const GNSSContext = createContext<GNSSContextType | null>(null);

// export const useGNSS = () => {
//   const ctx = useContext(GNSSContext);
//   if (!ctx) throw new Error("useGNSS must be used inside GNSSProvider");
//   return ctx;
// };

// /* ================= PROVIDER ================= */

// export const GNSSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const wsRef = useRef<WebSocket | null>(null);
//   const stoppingRef = useRef(false);
//   const intentionalDisconnectRef = useRef(false);
  
//   // ⭐ Core Fix: Tracks if auto-survey has run. Starts true (locked) so it never runs on boot.
//   const autoSurveyRunRef = useRef<boolean>(true);

//   /* ================= STATE ================= */

//   const [connection, setConnection] = useState<ConnectionState>({
//     connectionType: "none",
//     isConnected: false,
//     lastConnectedTimestamp: null,
//     signalStrength: 0,
//     latency: 0,
//     autoReconnect: true,
//   });

//   const [survey, setSurvey] = useState<SurveyState>({
//     surveyMode: "survey-in",
//     isActive: false,
//     valid: false,
//     progress: 0,
//     elapsedTime: 0,
//     requiredTime: 30,
//     currentAccuracy: 0,
//     targetAccuracy: 200,
//     position: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
//     localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
//     status: "idle",
//     satelliteCount: 0,
//   });

//   const [isAutoFlowActive, setIsAutoFlowActive] = useState(false);

//   const [gnssStatus, setGNSSStatus] = useState<GNSSStatus>({
//     satellites: [],
//     fixType: "none",
//     dop: { hdop: null, vdop: null, pdop: null },
//     updateRate: 1,
//     lastUpdate: new Date(),
//     firmwareVersion: "unknown",
//     activeConstellations: [],
//     globalPosition: { latitude: 0, longitude: 0, altitude: 0, horizontalAccuracy: 0 },
//   });

//   const defaultStream = { enabled: false, active: false, throughput: 0, messageRate: 0 };
//   const [streams, setStreams] = useState<StreamState>({
//     serial: { ...defaultStream },
//     ntrip: { ...defaultStream, mountpoint: "", uptime: 0, dataSent: 0, lastError: null },
//     tcp: { ...defaultStream, connectedClients: 0 },
//     udp: { ...defaultStream },
//   });

//   const [availableWiFiNetworks, setAvailableWiFiNetworks] = useState<WiFiNetwork[]>([]);
//   const [availableBLEDevices, setAvailableBLEDevices] = useState<BLEDevice[]>([]);
//   const [surveyHistory, setSurveyHistory] = useState<SurveyHistoryEntry[]>([]);
//   const [logs, setLogs] = useState<LogEntry[]>([]);

//   /* ================= PERSISTED DEFAULTS ================= */
//   const DEFAULT_CONFIG: Configuration = {
//     baseStation: {
//       surveyDuration: 120,
//       accuracyThreshold: 200,
//       autoStart: false,
//       autoMode: false,
//       fixedMode: { enabled: false, coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 } },
//     },
//     streams: {
//       ntrip: { server: "caster.emlid.com", port: 2101, mountpoint: "", username: "", password: "" },
//       serial: { baudRate: 115200, messages: [], rates: [] },
//       tcp: { port: 9000, maxClients: 5, authEnabled: false },
//       udp: { port: 8001, broadcastAddress: "", multicast: false },
//     },
//     system: { wifiSsid: "", wifiPassword: "", ledMode: "status", ledBrightness: 80 },
//   };

//   const DEFAULT_SETTINGS: AppSettings = {
//     units: { distance: "meters", coordinates: "DD" },
//     theme: "system",
//     language: "en",
//     notifications: { surveyCompletion: true, connectionLoss: true, lowAccuracy: true, sound: true, vibration: true },
//     connection: { preferredMethod: "auto", autoReconnect: true, timeout: 10, keepScreenAwake: true },
//   };

//   const loadPersistedConfig = (): Configuration => {
//     try {
//       const saved = localStorage.getItem('gnss_configuration');
//       if (saved) {
//         const parsed = JSON.parse(saved) as Configuration;
//         return {
//           ...DEFAULT_CONFIG,
//           ...parsed,
//           baseStation: {
//             ...DEFAULT_CONFIG.baseStation, ...parsed.baseStation,
//             fixedMode: {
//               ...DEFAULT_CONFIG.baseStation.fixedMode, ...parsed.baseStation?.fixedMode,
//               coordinates: { ...DEFAULT_CONFIG.baseStation.fixedMode.coordinates, ...parsed.baseStation?.fixedMode?.coordinates },
//             },
//           },
//           streams: {
//             ...DEFAULT_CONFIG.streams, ...parsed.streams,
//             ntrip: { ...DEFAULT_CONFIG.streams.ntrip, ...parsed.streams?.ntrip },
//             serial: { ...DEFAULT_CONFIG.streams.serial, ...parsed.streams?.serial },
//             tcp: { ...DEFAULT_CONFIG.streams.tcp, ...parsed.streams?.tcp },
//             udp: { ...DEFAULT_CONFIG.streams.udp, ...parsed.streams?.udp },
//           },
//           system: { ...DEFAULT_CONFIG.system, ...parsed.system },
//         };
//       }
//     } catch (e) {
//       console.warn('Failed to load saved configuration, using defaults:', e);
//     }
//     return DEFAULT_CONFIG;
//   };

//   const loadPersistedSettings = (): AppSettings => {
//     try {
//       const saved = localStorage.getItem('gnss_settings');
//       if (saved) {
//         const parsed = JSON.parse(saved) as AppSettings;
//         return {
//           ...DEFAULT_SETTINGS,
//           ...parsed,
//           units: { ...DEFAULT_SETTINGS.units, ...parsed.units },
//           notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
//           connection: { ...DEFAULT_SETTINGS.connection, ...parsed.connection },
//         };
//       }
//     } catch (e) {
//       console.warn('Failed to load saved settings, using defaults:', e);
//     }
//     return DEFAULT_SETTINGS;
//   };

//   const [configuration, setConfiguration] = useState<Configuration>(loadPersistedConfig);
//   const [settings, setSettings] = useState<AppSettings>(loadPersistedSettings);

//   /* ================= HELPER FUNCTIONS ================= */

//   useEffect(() => {
//     const syncAutoMode = () => {
//       api.getAutoFlowConfig()
//         .then((cfg) => {
//           if (typeof cfg.enabled === 'boolean') {
//             setConfiguration(prev => {
//               if (prev.baseStation.autoMode === cfg.enabled) return prev; 
//               const updated = {
//                 ...prev,
//                 baseStation: { ...prev.baseStation, autoMode: cfg.enabled },
//               };
//               localStorage.setItem('gnss_configuration', JSON.stringify(updated));
//               return updated;
//             });
//           }
//         })
//         .catch(() => { }); 
//     };

//     syncAutoMode(); 
//     const interval = setInterval(syncAutoMode, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const addLog = useCallback((level: 'error' | 'warning' | 'info', message: string) => {
//     setLogs((prev) => [{ id: Date.now().toString(), timestamp: new Date(), level, message }, ...prev].slice(0, 500));
//   }, []);

//   /* ================= WEBSOCKET ================= */

//   const connectWebSocket = useCallback(() => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) return;

//     wsRef.current = new WebSocket(WS_URL);

//     wsRef.current.onopen = () => {
//       setConnection((prev) => ({ ...prev, isConnected: true, lastConnectedTimestamp: new Date() }));
//       addLog('info', 'WebSocket connected');
//     };

//     wsRef.current.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);

//         const satellites: Satellite[] = Array.from(
//           { length: data.gnss?.num_satellites || 0 },
//           (_, i) => ({ id: i, constellation: "GPS", elevation: 0, azimuth: 0, snr: 0, used: true })
//         );

//         setGNSSStatus({
//           satellites,
//           fixType: data.gnss?.fix_type ?? "none",
//           dop: { hdop: data.gnss?.hdop ?? null, vdop: data.gnss?.vdop ?? null, pdop: data.gnss?.pdop ?? null },
//           updateRate: data.gnss?.update_rate_hz ?? 1,
//           lastUpdate: new Date(),
//           firmwareVersion: data.system?.firmware_version ?? "unknown",
//           activeConstellations: ["GPS"],
//           globalPosition: {
//             latitude: data.gnss?.latitude ?? 0,
//             longitude: data.gnss?.longitude ?? 0,
//             altitude: data.gnss?.altitude_msl ?? 0,
//             horizontalAccuracy: data.gnss?.horizontal_accuracy ?? 0,
//           },
//         });

//         if (data.autoflow !== undefined) {
//           setIsAutoFlowActive(data.autoflow.active ?? false);
//         }

//         setSurvey((prev) => {
//           const wsActive = data.survey?.active ?? false;

//           if (stoppingRef.current) {
//             return prev;
//           }

//           const wsAccuracy = (data.survey?.accuracy_m ?? 0) * 100;

//           if (wsActive && !prev.isActive) {
//             return {
//               ...prev,
//               isActive: true,
//               status: "in-progress",
//               elapsedTime: data.survey?.progress_seconds ?? 0,
//               currentAccuracy: wsAccuracy,
//               satelliteCount: data.gnss?.num_satellites ?? 0,
//             };
//           }

//           if (prev.isActive) {
//             const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;
//             return {
//               ...prev,
//               satelliteCount: data.gnss?.num_satellites ?? prev.satelliteCount,
//               currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
//               position: {
//                 latitude: data.gnss?.latitude ?? prev.position.latitude,
//                 longitude: data.gnss?.longitude ?? prev.position.longitude,
//                 altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
//                 accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
//               },
//               isActive: wsActive,
//               status: !wsActive ? 'stopped' : prev.status,
//             };
//           }

//           return prev;
//         });

//       } catch (e) {
//         console.error("WebSocket parse error:", e);
//       }
//     };

//     wsRef.current.onclose = () => {
//       if (intentionalDisconnectRef.current) {
//         intentionalDisconnectRef.current = false;
//         setConnection((prev) => ({ ...prev, isConnected: false }));
//       }
//     };
//   }, [addLog]);

//   useEffect(() => {
//     connectWebSocket();

//     const reconnectTimer = setInterval(() => {
//       const wsDown = wsRef.current?.readyState !== WebSocket.OPEN;
//       const surveyInactive = !survey.isActive;
//       const notIntentionalDisconnect = !intentionalDisconnectRef.current;

//       if (wsDown && surveyInactive && notIntentionalDisconnect && connection.isConnected) {
//         connectWebSocket();
//       }
//     }, 5000);

//     return () => clearInterval(reconnectTimer);
//   }, [connectWebSocket, survey.isActive, connection.isConnected]);

//   /* ================= START SURVEY ================= */
//   const startSurvey = useCallback(async () => {
//     try {
//       const currentDuration = configuration.baseStation.surveyDuration;
//       const currentAccuracy = configuration.baseStation.accuracyThreshold;

//       setSurvey((prev) => ({
//         ...prev,
//         isActive: true,
//         status: "initializing",
//         progress: 0,
//         elapsedTime: 0,
//         targetAccuracy: currentAccuracy,
//         requiredTime: currentDuration,
//         currentAccuracy: 0,
//       }));

//       await api.startSurvey(currentDuration, currentAccuracy / 100);
//       addLog('info', 'Survey started successfully');
//     } catch (error) {
//       addLog('error', `Survey start failed: ${String(error)}`);
//       setSurvey((prev) => ({ ...prev, isActive: false, status: "failed" }));
//       throw error;
//     }
//   }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, addLog]);

//   /* ================= STOP SURVEY ================= */
//   const stopSurvey = useCallback(async () => {
//     try {
//       addLog('info', 'Stopping survey');
//       stoppingRef.current = true;
//       setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));

//       let stopAttempts = 0;
//       let stopSucceeded = false;
//       const maxRetries = 2;

//       while (stopAttempts < maxRetries && !stopSucceeded) {
//         try {
//           stopAttempts++;
//           await api.stopSurvey();
//           stopSucceeded = true;
//           addLog('info', 'Survey stopped successfully on backend');
//         } catch (apiError) {
//           if (stopAttempts < maxRetries) {
//             addLog('warning', `Stop attempt ${stopAttempts}/${maxRetries} failed, retrying...`);
//             await new Promise(resolve => setTimeout(resolve, 500));
//           } else {
//             addLog('warning', `Backend stop failed after ${maxRetries} attempts (UI stopped locally)`);
//           }
//         }
//       }

//       const historyEntry: SurveyHistoryEntry = {
//         id: `survey_${Date.now()}`,
//         timestamp: new Date(),
//         duration: survey.elapsedTime,
//         finalAccuracy: survey.currentAccuracy,
//         targetAccuracy: survey.targetAccuracy,
//         accuracyAttempts: [],
//         coordinates: survey.position,
//         success: survey.currentAccuracy <= survey.targetAccuracy,
//       };
//       setSurveyHistory((prev) => [historyEntry, ...prev]);

//     } catch (error) {
//       addLog('error', `Unexpected survey stop error: ${String(error)}`);
//       setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));
//     } finally {
//       setTimeout(() => {
//         stoppingRef.current = false;
//       }, 1000);
//     }
//   }, [survey.elapsedTime, survey.targetAccuracy, survey.position, addLog]);

//   /* ================= CONNECTION FUNCTIONS ================= */
//   const connectToDevice = useCallback(async (type: "wifi" | "ble", identifier: string, password?: string) => {
//     try {
//       if (type === "wifi") await connectWifi(identifier, password);
//       connectWebSocket();
//       setConnection(prev => ({ ...prev, isConnected: true, connectionType: type }));
//       addLog('info', `Connected via ${type}`);
//     } catch (error) {
//       addLog('error', `Connection failed: ${String(error)}`);
//       throw error;
//     }
//   }, [connectWebSocket, addLog]);

//   const disconnect = useCallback(() => {
//     intentionalDisconnectRef.current = true;
//     stoppingRef.current = false;
//     setSurvey(prev => ({ ...prev, isActive: false, status: 'idle' }));
//     setIsAutoFlowActive(false);
//     wsRef.current?.close();
//     addLog('info', 'Disconnected from device');
//   }, [addLog]);

//   /* ================= STREAM FUNCTIONS ================= */
//   const toggleStream = useCallback(async (key: keyof StreamState, enabled: boolean) => {
//     try {
//       addLog('info', `${enabled ? 'Enabling' : 'Disabling'} ${key} stream`);
//     } catch (error) {
//       addLog('error', `Stream toggle failed: ${String(error)}`);
//       throw error;
//     }
//   }, [addLog]);

//   /* ================= SCAN FUNCTIONS ================= */
//   const scanWiFi = useCallback(async () => {
//     try {
//       const networks = await scanWifi();
//       setAvailableWiFiNetworks(networks);
//       addLog('info', `Found ${networks.length} WiFi networks`);
//     } catch (error) {
//       addLog('error', `WiFi scan failed: ${String(error)}`);
//     }
//   }, [addLog]);

//   const scanBLE = useCallback(async () => {
//     try {
//       addLog('info', 'BLE scan started');
//     } catch (error) {
//       addLog('error', `BLE scan failed: ${String(error)}`);
//     }
//   }, [addLog]);

//   /* ================= CONFIG & SETTINGS ================= */
//   const updateConfiguration = useCallback((config: Configuration) => {
//     setConfiguration(config);
//     try {
//       localStorage.setItem('gnss_configuration', JSON.stringify(config));
//     } catch (e) {
//       console.warn('Failed to save configuration:', e);
//     }

//     // ⭐ Core Fix: ONLY when "Save Changes" is pressed, explicitly allow auto mode to trigger once.
//     if (config.baseStation.autoMode) {
//       autoSurveyRunRef.current = false;
//     }

//     addLog('info', 'Configuration saved');
//   }, [addLog]);

//   const updateSettings = useCallback((patch: Partial<AppSettings>) => {
//     setSettings((prev) => {
//       const next = { ...prev, ...patch };
//       try {
//         localStorage.setItem('gnss_settings', JSON.stringify(next));
//       } catch (e) {
//         console.warn('Failed to save settings:', e);
//       }
//       return next;
//     });
//   }, []);

//   const clearLogs = useCallback(() => setLogs([]), []);
//   const exportHistoryCSV = useCallback(async () => {}, []);
//   const exportLogsCSV = useCallback(async () => {}, []);

//   /* ================= NTRIP FUNCTIONS ================= */
//   const startNTRIP = useCallback(async (host: string, port: number, mountpoint: string, password: string, username?: string) => {
//     try {
//       addLog('info', `Starting NTRIP: ${host}:${port}/${mountpoint}`);
//       setStreams((prev) => ({
//         ...prev,
//         ntrip: { ...prev.ntrip, enabled: true, active: true, mountpoint },
//       }));
//       await api.startNTRIP(host, port, mountpoint, password, username);
//       addLog('info', 'NTRIP started successfully');
//     } catch (error) {
//       setStreams((prev) => ({
//         ...prev,
//         ntrip: { ...prev.ntrip, enabled: false, active: false },
//       }));
//       addLog('error', `NTRIP start failed: ${String(error)}`);
//       throw error;
//     }
//   }, [addLog]);

//   const stopNTRIP = useCallback(async () => {
//     try {
//       addLog('info', 'Stopping NTRIP');
//       setStreams((prev) => ({
//         ...prev,
//         ntrip: { ...prev.ntrip, enabled: false, active: false, throughput: 0, uptime: 0, dataSent: 0 },
//       }));
//       await api.stopNTRIP();
//       addLog('info', 'NTRIP stopped successfully');
//     } catch (error) {
//       addLog('error', `NTRIP stop failed: ${String(error)}`);
//       throw error;
//     }
//   }, [addLog]);

//   /* ================= SURVEY TIMER ================= */
//   useEffect(() => {
//     if (!survey.isActive) return;

//     const surveyInterval = setInterval(() => {
//       setSurvey((prev) => {
//         // ⭐ Let internal elapsed time grow infinitely to record actual backend duration accurately
//         const newElapsedTime = prev.elapsedTime + 1;
//         const progress = Math.min(newElapsedTime / prev.requiredTime, 1);
//         return { ...prev, elapsedTime: newElapsedTime, progress };
//       });
//     }, 1000);

//     return () => clearInterval(surveyInterval);
//   }, [survey.isActive]);

//   /* ================= SURVEY STATUS POLL ================= */
//   useEffect(() => {
//     if (!survey.isActive) return;

//     const pollInterval = setInterval(async () => {
//       try {
//         const surveyStatus = await api.getSurveyStatus();
//         if (surveyStatus && !stoppingRef.current) {
//           setSurvey((prev) => {
//             if (prev.status === 'completed') return prev;

//             const pollAccuracy = (surveyStatus.accuracy_m ?? 0) * 100;
//             const pollElapsed = surveyStatus.progress_seconds ?? prev.elapsedTime;
            
//             return {
//               ...prev,
//               elapsedTime: pollElapsed, // Real elapsed time (unclamped internally)
//               currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
//               isActive: surveyStatus.active ?? prev.isActive,
//             };
//           });
//         }
//       } catch (e) {
//         console.warn("Survey status poll failed:", e);
//       }
//     }, 2000);

//     return () => clearInterval(pollInterval);
//   }, [survey.isActive]);

//   /* ================= NTRIP STATUS POLL ================= */
//   useEffect(() => {
//     const pollInterval = setInterval(async () => {
//       try {
//         const ntripStatus = await api.getNTRIP();
//         if (ntripStatus) {
//           setStreams((prev) => ({
//             ...prev,
//             ntrip: {
//               ...prev.ntrip,
//               enabled: ntripStatus.enabled ?? false,
//               active: ntripStatus.connected ?? false,
//               throughput: ntripStatus.data_rate_bps ?? 0,
//               mountpoint: ntripStatus.mountpoint ?? prev.ntrip.mountpoint,
//               uptime: ntripStatus.uptime_seconds ?? 0,
//               dataSent: ntripStatus.bytes_sent ?? 0,
//               lastError: null,
//             },
//           }));
//         }
//       } catch (e) {
//         console.warn("NTRIP status poll failed:", e);
//       }
//     }, 2000);
//     return () => clearInterval(pollInterval);
//   }, []);

//   /* ================= AUTO MODE ================= */
//   useEffect(() => {
//     if (
//       configuration.baseStation.autoMode &&
//       !survey.isActive &&
//       connection.isConnected &&
//       !stoppingRef.current &&
//       !autoSurveyRunRef.current // ⭐ Ensure we ONLY run if explicitly allowed by "Save"
//     ) {
//       autoSurveyRunRef.current = true; // ⭐ Instantly lock it. It will never run again unless unlocked.

//       const timer = setTimeout(() => {
//         startSurvey().catch(err => {
//           console.error("Auto start failed", err);
//           addLog('error', `Auto start failed: ${String(err)}`);
//         });
//       }, 500);
//       return () => clearTimeout(timer);
//     }
//   }, [configuration.baseStation.autoMode, connection.isConnected, survey.isActive, startSurvey, addLog]);

//   /* ================= CONFIG SYNC ================= */
//   useEffect(() => {
//     if (survey.isActive) {
//       setSurvey((prev) => ({
//         ...prev,
//         requiredTime: configuration.baseStation.surveyDuration,
//         targetAccuracy: configuration.baseStation.accuracyThreshold,
//       }));
//     }
//   }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, survey.isActive]);

//   /* ================= CONTEXT VALUE ================= */

//   const value = useMemo(
//     () => ({
//       connection,
//       connectToDevice,
//       disconnect,
//       survey,
//       startSurvey,
//       stopSurvey,
//       isAutoFlowActive,
//       gnssStatus,
//       streams,
//       toggleStream,
//       configuration,
//       updateConfiguration,
//       settings,
//       updateSettings,
//       availableWiFiNetworks,
//       availableBLEDevices,
//       scanWiFi,
//       scanBLE,
//       surveyHistory,
//       logs,
//       addLog,
//       clearLogs,
//       exportHistoryCSV,
//       exportLogsCSV,
//       startNTRIP,
//       stopNTRIP,
//     }),
//     [connection, survey, isAutoFlowActive, gnssStatus, streams, configuration, settings, surveyHistory, logs, connectToDevice, disconnect, startSurvey, stopSurvey, toggleStream, updateConfiguration, updateSettings, scanWiFi, scanBLE, addLog, clearLogs, exportHistoryCSV, exportLogsCSV, startNTRIP, stopNTRIP]
//   );

//   return (
//     <GNSSContext.Provider value={value}>
//       {children}
//     </GNSSContext.Provider>
//   );
// };

































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

import { api, WS_URL } from "../api/gnssApi";
import { scanWifi, connectWifi } from "../native/wifi";
import { uiLogger } from "../utils/uiLogger";

/* ================= CONTEXT TYPE ================= */

type GNSSContextType = {
  connection: ConnectionState;
  connectToDevice: (type: "wifi" | "ble", identifier: string, password?: string) => Promise<void>;
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
  const stoppingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  
  const autoSurveyRunRef = useRef<boolean>(true);

  /* ================= STATE ================= */

  const [connection, setConnection] = useState<ConnectionState>({
    connectionType: "none",
    isConnected: false,
    lastConnectedTimestamp: null,
    signalStrength: 0,
    latency: 0,
    autoReconnect: true,
  });

  const [survey, setSurvey] = useState<SurveyState>({
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
  });

  const [isAutoFlowActive, setIsAutoFlowActive] = useState(false);

  const [gnssStatus, setGNSSStatus] = useState<GNSSStatus>({
    satellites: [],
    fixType: "none",
    dop: { hdop: null, vdop: null, pdop: null },
    updateRate: 1,
    lastUpdate: new Date(),
    firmwareVersion: "unknown",
    activeConstellations: [],
    globalPosition: { latitude: 0, longitude: 0, altitude: 0, horizontalAccuracy: 0 },
  });

  const defaultStream = { enabled: false, active: false, throughput: 0, messageRate: 0 };
  const [streams, setStreams] = useState<StreamState>({
    serial: { ...defaultStream },
    ntrip: { ...defaultStream, mountpoint: "", uptime: 0, dataSent: 0, lastError: null },
    tcp: { ...defaultStream, connectedClients: 0 },
    udp: { ...defaultStream },
  });

  const [availableWiFiNetworks, setAvailableWiFiNetworks] = useState<WiFiNetwork[]>([]);
  const [availableBLEDevices, setAvailableBLEDevices] = useState<BLEDevice[]>([]);
  const [surveyHistory, setSurveyHistory] = useState<SurveyHistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

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
      const saved = localStorage.getItem('gnss_configuration');
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
      const saved = localStorage.getItem('gnss_settings');
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

  /* ================= HELPER FUNCTIONS ================= */

  useEffect(() => {
    const syncAutoMode = () => {
      api.getAutoFlowConfig()
        .then((cfg) => {
          if (typeof cfg.enabled === 'boolean') {
            setConfiguration(prev => {
              if (prev.baseStation.autoMode === cfg.enabled) return prev; 
              const updated = {
                ...prev,
                baseStation: { ...prev.baseStation, autoMode: cfg.enabled },
              };
              localStorage.setItem('gnss_configuration', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => { }); 
    };

    syncAutoMode(); 
    const interval = setInterval(syncAutoMode, 5000);
    return () => clearInterval(interval);
  }, []);

  const addLog = useCallback((level: 'error' | 'warning' | 'info', message: string) => {
    setLogs((prev) => [{ id: Date.now().toString(), timestamp: new Date(), level, message }, ...prev].slice(0, 500));
  }, []);

  /* ================= WEBSOCKET ================= */

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      setConnection((prev) => ({ ...prev, isConnected: true, lastConnectedTimestamp: new Date() }));
      addLog('info', 'WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const satellites: Satellite[] = Array.from(
          { length: data.gnss?.num_satellites || 0 },
          (_, i) => ({ id: i, constellation: "GPS", elevation: 0, azimuth: 0, snr: 0, used: true })
        );

        setGNSSStatus({
          satellites,
          fixType: data.gnss?.fix_type ?? "none",
          dop: { hdop: data.gnss?.hdop ?? null, vdop: data.gnss?.vdop ?? null, pdop: data.gnss?.pdop ?? null },
          updateRate: data.gnss?.update_rate_hz ?? 1,
          lastUpdate: new Date(),
          firmwareVersion: data.system?.firmware_version ?? "unknown",
          activeConstellations: ["GPS"],
          globalPosition: {
            latitude: data.gnss?.latitude ?? 0,
            longitude: data.gnss?.longitude ?? 0,
            altitude: data.gnss?.altitude_msl ?? 0,
            horizontalAccuracy: data.gnss?.horizontal_accuracy ?? 0,
          },
        });

        if (data.autoflow !== undefined) {
          setIsAutoFlowActive(data.autoflow.active ?? false);
        }

        setSurvey((prev) => {
          const wsActive = data.survey?.active ?? false;
          if (stoppingRef.current) return prev;

          const wsAccuracy = (data.survey?.accuracy_m ?? 0) * 100;
          
          const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
          const pos = data.survey?.position || data.survey?.local_position || {};
          
          const wsLocalCoords = {
            meanX: parseVal(data.survey?.mean_x_m ?? data.survey?.meanX ?? data.survey?.ecef_x ?? data.survey?.x ?? pos.x ?? pos[0]) ?? prev.localCoordinates.meanX,
            meanY: parseVal(data.survey?.mean_y_m ?? data.survey?.meanY ?? data.survey?.ecef_y ?? data.survey?.y ?? pos.y ?? pos[1]) ?? prev.localCoordinates.meanY,
            meanZ: parseVal(data.survey?.mean_z_m ?? data.survey?.meanZ ?? data.survey?.ecef_z ?? data.survey?.z ?? pos.z ?? pos[2]) ?? prev.localCoordinates.meanZ,
            observations: data.survey?.observations ?? prev.localCoordinates.observations,
          };

          if (wsActive && !prev.isActive) {
            return {
              ...prev,
              isActive: true,
              status: "in-progress",
              elapsedTime: data.survey?.progress_seconds ?? 0,
              currentAccuracy: wsAccuracy,
              satelliteCount: data.gnss?.num_satellites ?? 0,
              localCoordinates: wsLocalCoords,
            };
          }

          if (prev.isActive) {
            const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;
            return {
              ...prev,
              satelliteCount: data.gnss?.num_satellites ?? prev.satelliteCount,
              currentAccuracy: shouldUpdateAccuracy ? wsAccuracy : prev.currentAccuracy,
              position: {
                latitude: data.gnss?.latitude ?? prev.position.latitude,
                longitude: data.gnss?.longitude ?? prev.position.longitude,
                altitude: data.gnss?.altitude_msl ?? prev.position.altitude,
                accuracy: data.gnss?.horizontal_accuracy ?? prev.position.accuracy,
              },
              localCoordinates: wsLocalCoords,
              isActive: wsActive,
              status: !wsActive ? 'stopped' : prev.status,
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
  }, [addLog]);

  useEffect(() => {
    connectWebSocket();

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

      setSurvey((prev) => ({
        ...prev,
        isActive: true,
        status: "initializing",
        progress: 0,
        elapsedTime: 0,
        targetAccuracy: currentAccuracy,
        requiredTime: currentDuration,
        currentAccuracy: 0,
      }));

      await api.startSurvey(currentDuration, currentAccuracy / 100);
      addLog('info', 'Survey started successfully');
    } catch (error) {
      addLog('error', `Survey start failed: ${String(error)}`);
      setSurvey((prev) => ({ ...prev, isActive: false, status: "failed" }));
      throw error;
    }
  }, [configuration.baseStation.surveyDuration, configuration.baseStation.accuracyThreshold, addLog]);

  /* ================= STOP SURVEY ================= */
  const stopSurvey = useCallback(async () => {
    try {
      addLog('info', 'Stopping survey');
      stoppingRef.current = true;
      setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));

      let stopAttempts = 0;
      let stopSucceeded = false;
      const maxRetries = 2;

      while (stopAttempts < maxRetries && !stopSucceeded) {
        try {
          stopAttempts++;
          await api.stopSurvey();
          stopSucceeded = true;
          addLog('info', 'Survey stopped successfully on backend');
        } catch (apiError) {
          if (stopAttempts < maxRetries) {
            addLog('warning', `Stop attempt ${stopAttempts}/${maxRetries} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            addLog('warning', `Backend stop failed after ${maxRetries} attempts (UI stopped locally)`);
          }
        }
      }

      const historyEntry: SurveyHistoryEntry = {
        id: `survey_${Date.now()}`,
        timestamp: new Date(),
        duration: survey.elapsedTime,
        finalAccuracy: survey.currentAccuracy,
        targetAccuracy: survey.targetAccuracy,
        accuracyAttempts: [],
        coordinates: survey.position,
        success: survey.currentAccuracy <= survey.targetAccuracy,
      };
      setSurveyHistory((prev) => [historyEntry, ...prev]);

    } catch (error) {
      addLog('error', `Unexpected survey stop error: ${String(error)}`);
      setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));
    } finally {
      setTimeout(() => {
        stoppingRef.current = false;
      }, 1000);
    }
  }, [survey.elapsedTime, survey.targetAccuracy, survey.position, addLog]);

  /* ================= CONNECTION FUNCTIONS ================= */
  const connectToDevice = useCallback(async (type: "wifi" | "ble", identifier: string, password?: string) => {
    try {
      if (type === "wifi") await connectWifi(identifier, password);
      connectWebSocket();
      setConnection(prev => ({ ...prev, isConnected: true, connectionType: type }));
      addLog('info', `Connected via ${type}`);
    } catch (error) {
      addLog('error', `Connection failed: ${String(error)}`);
      throw error;
    }
  }, [connectWebSocket, addLog]);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    stoppingRef.current = false;
    setSurvey(prev => ({ ...prev, isActive: false, status: 'idle' }));
    setIsAutoFlowActive(false);
    wsRef.current?.close();
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
      addLog('info', 'BLE scan started');
    } catch (error) {
      addLog('error', `BLE scan failed: ${String(error)}`);
    }
  }, [addLog]);

  /* ================= CONFIG & SETTINGS ================= */
  const updateConfiguration = useCallback((config: Configuration) => {
    setConfiguration(config);
    try {
      localStorage.setItem('gnss_configuration', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save configuration:', e);
    }

    if (config.baseStation.autoMode) {
      autoSurveyRunRef.current = false;
    }

    addLog('info', 'Configuration saved');
  }, [addLog]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('gnss_settings', JSON.stringify(next));
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
        ntrip: { ...prev.ntrip, enabled: true, active: true, mountpoint },
      }));
      await api.startNTRIP(host, port, mountpoint, password, username);
      addLog('info', 'NTRIP started successfully');
    } catch (error) {
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
      setStreams((prev) => ({
        ...prev,
        ntrip: { ...prev.ntrip, enabled: false, active: false, throughput: 0, uptime: 0, dataSent: 0 },
      }));
      await api.stopNTRIP();
      addLog('info', 'NTRIP stopped successfully');
    } catch (error) {
      addLog('error', `NTRIP stop failed: ${String(error)}`);
      throw error;
    }
  }, [addLog]);

  /* ================= SURVEY TIMER ================= */
  useEffect(() => {
    if (!survey.isActive) return;

    const surveyInterval = setInterval(() => {
      setSurvey((prev) => {
        const newElapsedTime = prev.elapsedTime + 1;
        const progress = Math.min(newElapsedTime / prev.requiredTime, 1);
        return { ...prev, elapsedTime: newElapsedTime, progress };
      });
    }, 1000);

    return () => clearInterval(surveyInterval);
  }, [survey.isActive]);

  /* ================= SURVEY STATUS POLL ================= */
  useEffect(() => {
    // ⭐ Core Fix: Continously poll /api/v1/survey even when idle so we catch completed survey data!
    const pollInterval = setInterval(async () => {
      try {
        const surveyStatus = await api.getSurveyStatus();
        if (surveyStatus && !stoppingRef.current) {
          setSurvey((prev) => {
            
            const pollAccuracy = (surveyStatus.accuracy_m ?? 0) * 100;
            const pollElapsed = surveyStatus.progress_seconds ?? prev.elapsedTime;
            
            const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
            const pos = surveyStatus.position || surveyStatus.local_position || {};
            
            // ⭐ Aggressively hunt for local coordinates in the REST API payload
            const pollLocalCoords = {
              meanX: parseVal(surveyStatus.mean_x_m ?? surveyStatus.meanX ?? surveyStatus.ecef_x ?? surveyStatus.x ?? pos.x ?? pos[0]) ?? prev.localCoordinates.meanX,
              meanY: parseVal(surveyStatus.mean_y_m ?? surveyStatus.meanY ?? surveyStatus.ecef_y ?? surveyStatus.y ?? pos.y ?? pos[1]) ?? prev.localCoordinates.meanY,
              meanZ: parseVal(surveyStatus.mean_z_m ?? surveyStatus.meanZ ?? surveyStatus.ecef_z ?? surveyStatus.z ?? pos.z ?? pos[2]) ?? prev.localCoordinates.meanZ,
              observations: surveyStatus.observations ?? prev.localCoordinates.observations,
            };

            return {
              ...prev,
              elapsedTime: pollElapsed > 0 ? pollElapsed : prev.elapsedTime,
              currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
              isActive: surveyStatus.active ?? prev.isActive,
              localCoordinates: pollLocalCoords,
              status: surveyStatus.active ? "in-progress" : (prev.isActive && !surveyStatus.active ? "completed" : prev.status)
            };
          });
        }
      } catch (e) {
        console.warn("Survey status poll failed:", e);
      }
    }, survey.isActive ? 2000 : 5000); // Poll fast if active, slower if idle

    return () => clearInterval(pollInterval);
  }, [survey.isActive]); // Re-bind if isActive changes so interval speed updates

  /* ================= NTRIP STATUS POLL ================= */
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const ntripStatus = await api.getNTRIP();
        if (ntripStatus) {
          setStreams((prev) => ({
            ...prev,
            ntrip: {
              ...prev.ntrip,
              enabled: ntripStatus.enabled ?? false,
              active: ntripStatus.connected ?? false,
              throughput: ntripStatus.data_rate_bps ?? 0,
              mountpoint: ntripStatus.mountpoint ?? prev.ntrip.mountpoint,
              uptime: ntripStatus.uptime_seconds ?? 0,
              dataSent: ntripStatus.bytes_sent ?? 0,
              lastError: null,
            },
          }));
        }
      } catch (e) {
        console.warn("NTRIP status poll failed:", e);
      }
    }, 2000);
    return () => clearInterval(pollInterval);
  }, []);

  /* ================= AUTO MODE ================= */
  useEffect(() => {
    if (
      configuration.baseStation.autoMode &&
      !survey.isActive &&
      connection.isConnected &&
      !stoppingRef.current &&
      !autoSurveyRunRef.current 
    ) {
      autoSurveyRunRef.current = true; 

      const timer = setTimeout(() => {
        startSurvey().catch(err => {
          console.error("Auto start failed", err);
          addLog('error', `Auto start failed: ${String(err)}`);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [configuration.baseStation.autoMode, connection.isConnected, survey.isActive, startSurvey, addLog]);

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
      exportHistoryCSV,
      exportLogsCSV,
      startNTRIP,
      stopNTRIP,
    }),
    [connection, survey, isAutoFlowActive, gnssStatus, streams, configuration, settings, surveyHistory, logs, connectToDevice, disconnect, startSurvey, stopSurvey, toggleStream, updateConfiguration, updateSettings, scanWiFi, scanBLE, addLog, clearLogs, exportHistoryCSV, exportLogsCSV, startNTRIP, stopNTRIP]
  );

  return (
    <GNSSContext.Provider value={value}>
      {children}
    </GNSSContext.Provider>
  );
};