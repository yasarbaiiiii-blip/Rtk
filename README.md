# GNSS Base Station Web Application

A professional React-based web application for configuring and monitoring U-Blox ZED-F9P GNSS receivers operating as RTK base stations.

## Features

### 🔌 Connection Management
- **Dual Connectivity**: WiFi and Bluetooth Low Energy (BLE) support
- **Auto-discovery**: Automatic connection with fallback mechanism
- **Connection Health Monitoring**: Real-time signal strength and latency tracking
- **Persistent Status Banner**: Always-visible connection status

### 📊 Real-time Dashboard
Three comprehensive monitoring tabs:

#### Survey Status Tab
- Real-time survey progress with circular progress indicator
- Live accuracy monitoring (target vs. current)
- Satellite count tracking
- Position information with multiple coordinate formats (DD, DMS, UTM)
- One-click coordinate copying
- Survey configuration summary

#### GNSS Status Tab
- **Satellite Sky Plot**: Polar visualization of satellite positions
- Color-coded by constellation (GPS, GLONASS, Galileo, BeiDou)
- SNR (Signal-to-Noise Ratio) visualization
- **Signal Quality Metrics**: Bar chart of satellite SNR values
- DOP values display (HDOP, VDOP, PDOP)
- Receiver information (firmware, fix type, update rate)

#### Stream Status Tab
- **Serial Output**: UART communication monitoring
- **NTRIP Caster**: Network transport status and statistics
- **TCP Server**: Client connection management
- **UDP Broadcast**: Network broadcasting status
- Real-time throughput and message rate monitoring
- Stream enable/disable controls

### ⚙️ Configuration Management
Expandable accordion interface for organized settings:

- **Base Station Settings**
  - Survey duration configuration (60-600 seconds)
  - Accuracy threshold settings (1-10 cm)
  - Automatic start on boot
  - Fixed position mode with coordinate entry

- **Stream Configuration**
  - NTRIP caster settings (server, port, mountpoint, credentials)
  - Serial output configuration (baud rate, RTCM messages)
  - TCP server settings (port, max clients, authentication)
  - UDP broadcast configuration

- **System Settings**
  - WiFi hotspot configuration (SSID, password)
  - LED display settings (mode, brightness)

### 📜 History & Logs
- **Survey History**
  - Chronological list of completed surveys
  - Success/failure indicators
  - Detailed metadata (duration, accuracy, coordinates)
  - Export to CSV
  - Share functionality

- **System Logs**
  - Real-time log streaming
  - Filter by log level (All, Errors, Warnings, Info)
  - Search functionality
  - Export logs to text file

### 🎛️ Application Settings
- **Units**: Distance (meters/feet), Coordinates (DD/DMS/UTM)
- **Theme**: Light, Dark, or System preference
- **Language**: Multi-language support
- **Notifications**: Configurable alerts for survey completion, connection loss, accuracy warnings
- **Connection Preferences**: Preferred method, auto-reconnect, timeout settings
- **Data Management**: Clear cache, reset settings, clear WiFi passwords

## Technical Stack

- **Framework**: React 18.3.1 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Notifications**: Sonner
- **State Management**: React Context API

## Architecture

```
src/
├── types/gnss.ts              # TypeScript type definitions
├── context/GNSSContext.tsx    # Global state management
├── app/
│   ├── App.tsx                # Main application component
│   └── components/
│       ├── ConnectionScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── ConfigurationScreen.tsx
│       ├── HistoryScreen.tsx
│       ├── SettingsScreen.tsx
│       ├── ConnectionBanner.tsx
│       ├── dashboard/
│       │   ├── SurveyStatus.tsx
│       │   ├── GNSSStatusTab.tsx
│       │   └── StreamStatus.tsx
│       └── ui/                # Reusable UI components
```

## Key Features Implementation

### Real-time Data Updates
- Mock WebSocket simulation for live telemetry
- 1-second update intervals for GNSS status
- Automatic survey progress tracking
- Stream throughput monitoring

### Responsive Design
- Desktop: Full sidebar navigation
- Mobile: Collapsible hamburger menu
- Adaptive layouts for all screen sizes
- Touch-friendly controls

### Professional UI/UX
- Modern gradient accents
- Consistent color coding:
  - Blue: Active states and actions
  - Green: Success and good accuracy
  - Yellow: In-progress and warnings
  - Red: Errors and disconnected states
- Loading states and skeletons
- Toast notifications for user feedback

### Data Visualization
- Custom satellite sky plot with polar coordinates
- SNR bar charts with constellation color coding
- Circular progress indicators
- Real-time metric cards

## Mock Data & Demo Mode

The application includes comprehensive mock data for demonstration:
- Simulated satellite data (30+ satellites across 4 constellations)
- Real-time survey progression
- Stream statistics
- Survey history entries
- System logs

## Future Enhancements

As specified in the requirements document:
- Rover configuration module
- Multi-base station management
- Cloud data backup and sync
- Advanced analytics and reporting
- Map integration for position visualization

## Browser Compatibility

- Chrome/Edge: Full support including Web Bluetooth API
- Firefox: WebSocket support (limited BLE)
- Safari: WebSocket support (limited BLE on macOS)

## Notes

This is a frontend web application. For production use:
1. Replace mock WebSocket connections with actual backend integration
2. Implement real Web Bluetooth API calls
3. Add authentication and security measures
4. Integrate with actual U-Blox ZED-F9P hardware via backend server

---

Built with ❤️ using React and Tailwind CSS
