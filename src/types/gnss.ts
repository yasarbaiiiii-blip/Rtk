// GNSS Base Station Type Definitions

export type ConnectionType = 'wifi' | 'ble' | 'none';
export type SurveyMode = 'survey-in' | 'fixed';
export type SurveyStatus =
  | 'idle'
  | 'initializing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'stopped'
  | 'time-limit-reached';

export type FixType = 'none' | '2D' | '3D' | 'rtk-float' | 'rtk-fixed';
export type Constellation = 'GPS' | 'GLONASS' | 'Galileo' | 'BeiDou';
export type CoordinateFormat = 'DD' | 'DMS' | 'UTM';

/* ================= CONNECTION ================= */

export interface ConnectionState {
  connectionType: ConnectionType;
  isConnected: boolean;
  lastConnectedTimestamp: Date | null;
  signalStrength: number;
  latency: number;
  autoReconnect: boolean;
}

/* ================= POSITION / SURVEY ================= */

export interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
}

export interface SurveyState {
  surveyMode: SurveyMode;
  isActive: boolean;
  valid: boolean;
  progress: number;
  elapsedTime: number;
  requiredTime: number;
  currentAccuracy: number;
  targetAccuracy: number;
  position: Position;
  status: SurveyStatus;
  satelliteCount: number;
  // Local coordinates from survey processing
  localCoordinates: {
    meanX: number;
    meanY: number;
    meanZ: number;
    observations: number;
  };
}

/* ================= SATELLITES ================= */

export interface Satellite {
  id: number;
  constellation: Constellation;
  elevation: number;
  azimuth: number;
  snr: number;
  used: boolean;
}

export interface DOP {
  hdop: number | null;
  vdop: number | null;
  pdop: number | null;
}

export interface GNSSStatus {
  satellites: Satellite[];
  fixType: FixType;
  dop: DOP;
  updateRate: number;
  lastUpdate: Date;
  firmwareVersion: string;
  activeConstellations: Constellation[];
  // Global coordinates from GNSS receiver
  globalPosition: {
    latitude: number;
    longitude: number;
    altitude: number;
    horizontalAccuracy: number;
  };
}

/* ================= STREAMS ================= */

export interface StreamInfo {
  enabled: boolean;
  active: boolean;
  throughput: number;
  messageRate: number;
  connectedClients?: number;
}

export interface NTRIPStream extends StreamInfo {
  mountpoint: string;
  uptime: number;
  dataSent: number;
  dataReceived: number;
  lastError: string | null;
}

export interface StreamState {
  serial: StreamInfo;
  ntrip: NTRIPStream;
  tcp: StreamInfo & { connectedClients: number };
  udp: StreamInfo;
}

/* ================= CONFIG ================= */

export interface BaseStationConfig {
  surveyDuration: number;
  accuracyThreshold: number;
  autoStart: boolean;
  autoMode: boolean;
  fixedMode: {
    enabled: boolean;
    coordinates: Position;
  };
}

export interface NTRIPConfig {
  server: string;
  port: number;
  mountpoint: string;
  username: string;
  password: string;
}

export interface SerialConfig {
  baudRate: number;
  messages: string[];
  rates: number[];
}

export interface TCPConfig {
  port: number;
  maxClients: number;
  authEnabled: boolean;
}

export interface UDPConfig {
  port: number;
  broadcastAddress: string;
  multicast: boolean;
}

export interface SystemConfig {
  wifiSsid: string;
  wifiPassword: string;
  ledMode: string;
  ledBrightness: number;
}

export interface Configuration {
  baseStation: BaseStationConfig;
  streams: {
    ntrip: NTRIPConfig;
    serial: SerialConfig;
    tcp: TCPConfig;
    udp: UDPConfig;
  };
  system: SystemConfig;
}

/* ================= HISTORY / LOGS ================= */

export interface AccuracyAttempt {
  accuracy: number;
  timestamp: number; // elapsed time in seconds
  satelliteCount: number;
}

export interface SurveyHistoryEntry {
  id: string;
  timestamp: Date;
  duration: number;
  finalAccuracy: number;
  targetAccuracy: number;
  accuracyAttempts: AccuracyAttempt[];
  coordinates: Position;
  success: boolean;
  timeWhenMetTarget?: number; // elapsed time in seconds when target was met
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
}

/* ================= SETTINGS ================= */

export interface AppSettings {
  units: {
    distance: 'meters' | 'feet';
    coordinates: CoordinateFormat;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    surveyCompletion: boolean;
    connectionLoss: boolean;
    lowAccuracy: boolean;
    sound: boolean;
    vibration: boolean;
  };
  connection: {
    preferredMethod: 'wifi' | 'ble' | 'auto';
    autoReconnect: boolean;
    timeout: number;
    keepScreenAwake: boolean;
  };
}

export interface WiFiNetwork {
  ssid: string;
  signalStrength: number;
  secured: boolean;
}

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  mac: string;
}
