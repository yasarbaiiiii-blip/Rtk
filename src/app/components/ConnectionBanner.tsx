import React from 'react';
import { useGNSS } from '../../context/GNSSContext';
import { Badge } from './ui/badge';
import { Wifi, Bluetooth, WifiOff, Signal } from 'lucide-react';

export const ConnectionBanner: React.FC = () => {
  const { connection, isOfflinePreview } = useGNSS();

  const getSignalBars = (strength: number) => {
    if (strength === 0) return 0;
    if (strength > -50) return 4;
    if (strength > -60) return 3;
    if (strength > -70) return 2;
    return 1;
  };

  const getBannerColor = () => {
    if (!connection.isConnected) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!connection.isConnected) return 'Disconnected';
    return isOfflinePreview ? 'Offline Preview' : 'Connected';
  };

  const getConnectionIcon = () => {
    if (!connection.isConnected) {
      return <WifiOff className="size-4" />;
    }
    if (connection.connectionType === 'offline') {
      return <WifiOff className="size-4" />;
    }
    return connection.connectionType === 'wifi' ? (
      <Wifi className="size-4" />
    ) : (
      <Bluetooth className="size-4" />
    );
  };

  return (
    <div className={`${getBannerColor()} text-white px-4 py-2 flex items-center justify-between shadow-md`}>
      <div className="flex items-center gap-3">
        {getConnectionIcon()}
        <span className="font-medium">{getStatusText()}</span>
        {connection.isConnected && (
          <>
            <span className="text-sm opacity-90">
              via {connection.connectionType.toUpperCase()}
            </span>
            <div className="flex items-center gap-1">
              <Signal className="size-3" />
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-sm ${
                      i < getSignalBars(connection.signalStrength)
                        ? 'bg-white'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs opacity-75 ml-1">
                {connection.signalStrength} dBm
              </span>
            </div>
            <Badge variant="outline" className="text-white border-white/30">
              {connection.latency}ms
            </Badge>
          </>
        )}
      </div>
      {connection.lastConnectedTimestamp && (
        <span className="text-xs opacity-75">
          Last: {connection.lastConnectedTimestamp.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};
