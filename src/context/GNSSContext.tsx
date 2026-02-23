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
// import { toast } from "sonner"; 

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
//   clearSurveyHistory: () => void; 
//   deleteSurveys: (ids: string[]) => void; // ⭐ NEW: Added for selectable delete
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
//     setLogs((prev) => [{ id: Date.now().toString() + Math.random(), timestamp: new Date(), level, message }, ...prev].slice(0, 500));
//   }, []);

//   const clearSurveyHistory = useCallback(() => {
//     setSurveyHistory([]);
//     toast.success("Survey history cleared");
//   }, []);

//   // ⭐ NEW: Allow deletion of specific records
//   const deleteSurveys = useCallback((ids: string[]) => {
//     setSurveyHistory(prev => prev.filter(s => !ids.includes(s.id)));
//     toast.success(`Deleted ${ids.length} record(s)`);
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
//           if (stoppingRef.current) return prev;

//           const wsAccuracy = (data.survey?.accuracy_m ?? 0) * 100;
          
//           const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
//           const pos = data.survey?.position || data.survey?.local_position || {};
          
//           const wsLocalCoords = {
//             meanX: parseVal(data.survey?.mean_x_m ?? data.survey?.meanX ?? data.survey?.ecef_x ?? data.survey?.x ?? pos.x ?? pos[0]) ?? prev.localCoordinates.meanX,
//             meanY: parseVal(data.survey?.mean_y_m ?? data.survey?.meanY ?? data.survey?.ecef_y ?? data.survey?.y ?? pos.y ?? pos[1]) ?? prev.localCoordinates.meanY,
//             meanZ: parseVal(data.survey?.mean_z_m ?? data.survey?.meanZ ?? data.survey?.ecef_z ?? data.survey?.z ?? pos.z ?? pos[2]) ?? prev.localCoordinates.meanZ,
//             observations: data.survey?.observations ?? prev.localCoordinates.observations,
//           };

//           if (wsActive && !prev.isActive) {
//             return {
//               ...prev,
//               isActive: true,
//               status: "in-progress",
//               elapsedTime: data.survey?.progress_seconds ?? 0,
//               currentAccuracy: wsAccuracy,
//               satelliteCount: data.gnss?.num_satellites ?? 0,
//               localCoordinates: wsLocalCoords,
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
//               localCoordinates: wsLocalCoords,
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

//       setSurveyHistory((prev) => [{
//         id: `SRV-START-${Date.now().toString().slice(-6)}`,
//         timestamp: new Date(),
//         duration: 0,
//         finalAccuracy: 0,
//         targetAccuracy: currentAccuracy,
//         accuracyAttempts: [],
//         coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
//         localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
//         success: true,
//         eventType: 'started',
//         message: `Initialization sequence activated. Target: ${currentAccuracy}cm / ${currentDuration}s`
//       } as any, ...prev]);

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
//       setSurveyHistory((prev) => [{
//         id: `SRV-ERR-${Date.now().toString().slice(-6)}`,
//         timestamp: new Date(),
//         duration: 0,
//         finalAccuracy: 0,
//         targetAccuracy: configuration.baseStation.accuracyThreshold,
//         accuracyAttempts: [],
//         coordinates: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
//         localCoordinates: { meanX: 0, meanY: 0, meanZ: 0, observations: 0 },
//         success: false,
//         eventType: 'error',
//         message: `Hardware failed to initiate survey: ${String(error)}`
//       } as any, ...prev]);

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

//       setSurveyHistory((prev) => [{
//         id: `SRV-STOP-${Date.now().toString().slice(-6)}`,
//         timestamp: new Date(),
//         duration: survey.elapsedTime,
//         finalAccuracy: survey.currentAccuracy,
//         targetAccuracy: survey.targetAccuracy,
//         accuracyAttempts: [],
//         coordinates: survey.position,
//         localCoordinates: survey.localCoordinates,
//         success: false,
//         eventType: 'stopped',
//         message: 'Survey manually halted by operator.'
//       } as any, ...prev]);

//     } catch (error) {
//       setSurveyHistory((prev) => [{
//         id: `SRV-ERR-${Date.now().toString().slice(-6)}`,
//         timestamp: new Date(),
//         duration: survey.elapsedTime,
//         finalAccuracy: survey.currentAccuracy,
//         targetAccuracy: survey.targetAccuracy,
//         accuracyAttempts: [],
//         coordinates: survey.position,
//         localCoordinates: survey.localCoordinates,
//         success: false,
//         eventType: 'error',
//         message: `Stop execution error: ${String(error)}`
//       } as any, ...prev]);

//       addLog('error', `Unexpected survey stop error: ${String(error)}`);
//       setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));
//     } finally {
//       setTimeout(() => {
//         stoppingRef.current = false;
//       }, 1000);
//     }
//   }, [survey.elapsedTime, survey.targetAccuracy, survey.currentAccuracy, survey.position, survey.localCoordinates, addLog]);

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
//         const newElapsedTime = prev.elapsedTime + 1;
//         const progress = Math.min(newElapsedTime / prev.requiredTime, 1);
//         return { ...prev, elapsedTime: newElapsedTime, progress };
//       });
//     }, 1000);

//     return () => clearInterval(surveyInterval);
//   }, [survey.isActive]);

//   /* ================= SURVEY STATUS POLL ================= */
//   useEffect(() => {
//     const pollInterval = setInterval(async () => {
//       try {
//         const surveyStatus = await api.getSurveyStatus();
//         if (surveyStatus && !stoppingRef.current) {
//           setSurvey((prev) => {
//             const pollAccuracy = (surveyStatus.accuracy_m ?? 0) * 100;
//             const pollElapsed = surveyStatus.progress_seconds ?? prev.elapsedTime;
            
//             const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
//             const pos = surveyStatus.position || surveyStatus.local_position || {};
            
//             const pollLocalCoords = {
//               meanX: parseVal(surveyStatus.mean_x_m ?? surveyStatus.meanX ?? surveyStatus.ecef_x ?? surveyStatus.x ?? pos.x ?? pos[0]) ?? prev.localCoordinates.meanX,
//               meanY: parseVal(surveyStatus.mean_y_m ?? surveyStatus.meanY ?? surveyStatus.ecef_y ?? surveyStatus.y ?? pos.y ?? pos[1]) ?? prev.localCoordinates.meanY,
//               meanZ: parseVal(surveyStatus.mean_z_m ?? surveyStatus.meanZ ?? surveyStatus.ecef_z ?? surveyStatus.z ?? pos.z ?? pos[2]) ?? prev.localCoordinates.meanZ,
//               observations: surveyStatus.observations ?? prev.localCoordinates.observations,
//             };

//             return {
//               ...prev,
//               elapsedTime: pollElapsed > 0 ? pollElapsed : prev.elapsedTime,
//               currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
//               isActive: surveyStatus.active ?? prev.isActive,
//               localCoordinates: pollLocalCoords,
//               status: surveyStatus.active ? "in-progress" : (prev.isActive && !surveyStatus.active ? "completed" : prev.status)
//             };
//           });
//         }
//       } catch (e) {
//         console.warn("Survey status poll failed:", e);
//       }
//     }, survey.isActive ? 2000 : 5000);

//     return () => clearInterval(pollInterval);
//   }, [survey.isActive]);

//   // Log Auto-Complete events
//   const prevIsActive = useRef(survey.isActive);
//   useEffect(() => {
//     if (prevIsActive.current === true && survey.isActive === false && !stoppingRef.current) {
//       const isSuccess = survey.currentAccuracy <= survey.targetAccuracy && survey.currentAccuracy > 0;
      
//       setSurveyHistory((prev) => [{
//         id: `SRV-COMP-${Date.now().toString().slice(-6)}`,
//         timestamp: new Date(),
//         duration: survey.elapsedTime,
//         finalAccuracy: survey.currentAccuracy,
//         targetAccuracy: survey.targetAccuracy,
//         accuracyAttempts: [],
//         coordinates: { ...survey.position },
//         localCoordinates: { ...survey.localCoordinates },
//         success: isSuccess,
//         eventType: isSuccess ? 'completed' : 'error',
//         message: isSuccess ? 'Hardware reported successful convergence.' : 'Survey terminated without reaching target constraints.'
//       } as any, ...prev]);

//       addLog(isSuccess ? 'info' : 'warning', `Survey convergence complete. Accuracy: ${survey.currentAccuracy.toFixed(2)}cm`);
//     }
//     prevIsActive.current = survey.isActive;
//   }, [survey.isActive, survey.currentAccuracy, survey.targetAccuracy, survey.elapsedTime, survey.position, survey.localCoordinates, addLog]);

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
//       !autoSurveyRunRef.current 
//     ) {
//       autoSurveyRunRef.current = true; 

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
//       clearSurveyHistory,
//       deleteSurveys, // ⭐ Exported new function
//       exportHistoryCSV,
//       exportLogsCSV,
//       startNTRIP,
//       stopNTRIP,
//     }),
//     [connection, survey, isAutoFlowActive, gnssStatus, streams, configuration, settings, surveyHistory, logs, connectToDevice, disconnect, startSurvey, stopSurvey, toggleStream, updateConfiguration, updateSettings, scanWiFi, scanBLE, addLog, clearLogs, clearSurveyHistory, deleteSurveys, exportHistoryCSV, exportLogsCSV, startNTRIP, stopNTRIP]
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
import { toast } from "sonner"; 

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
  const stoppingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const startPendingRef = useRef(false);
  const startInitiatedAtRef = useRef(0);
  const START_PENDING_GRACE_MS = 3500;
  
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
    setLogs((prev) => [{ id: Date.now().toString() + Math.random(), timestamp: new Date(), level, message }, ...prev].slice(0, 500));
  }, []);

  const clearSurveyHistory = useCallback(() => {
    setSurveyHistory([]);
    toast.success("Survey history cleared");
  }, []);

  // Allow deletion of specific records
  const deleteSurveys = useCallback((ids: string[]) => {
    setSurveyHistory(prev => prev.filter(s => !ids.includes(s.id)));
    toast.success(`Deleted ${ids.length} record(s)`);
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
          const withinStartGrace =
            startPendingRef.current &&
            prev.isActive &&
            !wsActive &&
            (Date.now() - startInitiatedAtRef.current) < START_PENDING_GRACE_MS;

          if (wsActive && !prev.isActive) {
            startPendingRef.current = false;
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
            if (wsActive) {
              startPendingRef.current = false;
            }
            const shouldUpdateAccuracy = wsAccuracy > 0 && wsAccuracy < 5000;
            if (withinStartGrace) {
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
              };
            }
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
              status: !wsActive ? 'completed' : prev.status,
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
      startPendingRef.current = true;
      startInitiatedAtRef.current = Date.now();

      // Note: Removed the manual setSurveyHistory 'started' payload from here.
      // The Unified Watcher useEffect below will safely catch the transition to true and log it once.

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
      startPendingRef.current = false;
      // Hardware failure to start (Log Error immediately)
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
        message: `Hardware failed to initiate survey: ${String(error)}`
      } as any, ...prev]);

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
      startPendingRef.current = false;
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
      
      // Note: We don't log 'stopped' here anymore. The Unified Watcher catches `stoppingRef.current` and logs it safely.

    } catch (error) {
      addLog('error', `Unexpected survey stop error: ${String(error)}`);
      setSurvey((prev) => ({ ...prev, isActive: false, status: 'stopped' }));
    } finally {
      setTimeout(() => {
        stoppingRef.current = false;
      }, 1000);
    }
  }, [addLog]);

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
    startPendingRef.current = false;
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
    const pollInterval = setInterval(async () => {
      // Stop REST API polling from overriding live data if WebSocket is fully connected
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      try {
        const surveyStatus = await api.getSurveyStatus();
        if (surveyStatus && !stoppingRef.current) {
          setSurvey((prev) => {
            const pollAccuracy = (surveyStatus.accuracy_m ?? 0) * 100;
            const pollElapsed = surveyStatus.progress_seconds ?? prev.elapsedTime;
            const pollActive = surveyStatus.active ?? prev.isActive;
            const withinStartGrace =
              startPendingRef.current &&
              prev.isActive &&
              !pollActive &&
              (Date.now() - startInitiatedAtRef.current) < START_PENDING_GRACE_MS;
            
            const parseVal = (val: any) => val !== undefined && val !== null ? Number(val) : undefined;
            const pos = surveyStatus.position || surveyStatus.local_position || {};
            
            const pollLocalCoords = {
              meanX: parseVal(surveyStatus.mean_x_m ?? surveyStatus.meanX ?? surveyStatus.ecef_x ?? surveyStatus.x ?? pos.x ?? pos[0]) ?? prev.localCoordinates.meanX,
              meanY: parseVal(surveyStatus.mean_y_m ?? surveyStatus.meanY ?? surveyStatus.ecef_y ?? surveyStatus.y ?? pos.y ?? pos[1]) ?? prev.localCoordinates.meanY,
              meanZ: parseVal(surveyStatus.mean_z_m ?? surveyStatus.meanZ ?? surveyStatus.ecef_z ?? surveyStatus.z ?? pos.z ?? pos[2]) ?? prev.localCoordinates.meanZ,
              observations: surveyStatus.observations ?? prev.localCoordinates.observations,
            };

            if (pollActive) {
              startPendingRef.current = false;
            }

            if (withinStartGrace) {
              return {
                ...prev,
                elapsedTime: pollElapsed > 0 ? pollElapsed : prev.elapsedTime,
                currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
                localCoordinates: pollLocalCoords,
              };
            }

            return {
              ...prev,
              elapsedTime: pollElapsed > 0 ? pollElapsed : prev.elapsedTime,
              currentAccuracy: pollAccuracy > 0 ? pollAccuracy : prev.currentAccuracy,
              isActive: pollActive,
              localCoordinates: pollLocalCoords,
              status: pollActive ? "in-progress" : (prev.isActive && !pollActive ? "completed" : prev.status)
            };
          });
        }
      } catch (e) {
        console.warn("Survey status poll failed:", e);
      }
    }, survey.isActive ? 2000 : 5000);

    return () => clearInterval(pollInterval);
  }, [survey.isActive]);

  /* ================= UNIFIED SURVEY LIFECYCLE WATCHER ================= */
  const prevIsActive = useRef(survey.isActive);
  
  useEffect(() => {
    // Transition 1: FALSE ➔ TRUE (Survey has Started manually or via auto-flow)
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

    // Transition 2: TRUE ➔ FALSE (Survey has Finished, Errored, or was manually Stopped)
    if (prevIsActive.current === true && survey.isActive === false) {
      startPendingRef.current = false;
      
      // ANTI-FLUTTER SAFEGUARD: Ignore brief false-positives from network lag
      if (survey.elapsedTime < 2 && survey.currentAccuracy === 0 && !stoppingRef.current) {
        console.warn("Ignored ghost state transition (API Polling lag)");
      } 
      // Manual Stop
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
      // Natural Completion or Error
      else {
        const isSuccess = survey.currentAccuracy <= survey.targetAccuracy && survey.currentAccuracy > 0;
        
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
      clearSurveyHistory,
      deleteSurveys,
      exportHistoryCSV,
      exportLogsCSV,
      startNTRIP,
      stopNTRIP,
    }),
    [connection, survey, isAutoFlowActive, gnssStatus, streams, configuration, settings, surveyHistory, logs, connectToDevice, disconnect, startSurvey, stopSurvey, toggleStream, updateConfiguration, updateSettings, scanWiFi, scanBLE, addLog, clearLogs, clearSurveyHistory, deleteSurveys, exportHistoryCSV, exportLogsCSV, startNTRIP, stopNTRIP]
  );

  return (
    <GNSSContext.Provider value={value}>
      {children}
    </GNSSContext.Provider>
  );
};
