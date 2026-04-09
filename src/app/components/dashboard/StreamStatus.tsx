import React from "react";
import { useGNSS } from "../../../context/GNSSContext";
import {
  StreamState,
  StreamInfo,
  NTRIPStream,
} from "../../../types/gnss.ts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

import {
  Radio,
  Wifi,
  Server,
  Send,
  Activity,
  Users,
  Clock,
  Database,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/* ---------- TYPES ---------- */

type AnyStream = StreamInfo | NTRIPStream;

/* ---------- COMPONENT ---------- */

export const StreamStatus: React.FC = () => {
  const { streams, toggleStream, configuration } = useGNSS();

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  /* ---------- STREAM CARD ---------- */

  const StreamCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    streamKey: keyof StreamState;
    streamData: AnyStream;
    children?: React.ReactNode;
  }> = ({
    icon,
    title,
    description,
    streamKey,
    streamData,
    children,
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>

          <Badge
            variant={streamData.active ? "default" : "outline"}
            className={streamData.active ? "bg-green-500" : ""}
          >
            {streamData.active ? (
              <>
                <CheckCircle2 className="size-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <AlertCircle className="size-3 mr-1" />
                Inactive
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
          <Label htmlFor={`${String(streamKey)}-toggle`}>
            Enable Stream
          </Label>
          <Switch
            id={`${String(streamKey)}-toggle`}
            checked={streamData.enabled}
            onCheckedChange={(checked) =>
              toggleStream(streamKey, checked)
            }
          />
        </div>

        {streamData.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-4 text-blue-500" />
                <span className="text-xs">Throughput</span>
              </div>
              <div className="text-lg font-bold">
                {streamData.throughput > 0 ? streamData.throughput.toFixed(0) + ' B/s' : 'NIL'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="size-4 text-green-500" />
                <span className="text-xs">Message Rate</span>
              </div>
              <div className="text-lg font-bold">
                {streamData.messageRate > 0 ? streamData.messageRate.toFixed(1) + ' msg/s' : 'NIL'}
              </div>
            </div>
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );

  /* ---------- SUMMARY HELPERS ---------- */

  const allStreams = Object.values(streams) as AnyStream[];

  const activeCount = allStreams.filter(
    (s) => s.active
  ).length;

  const totalThroughput = allStreams.reduce(
    (sum, s) => sum + s.throughput,
    0
  );

  /* ---------- RENDER ---------- */

  return (
    <div className="space-y-6">
      <StreamCard
        icon={<Radio className="size-5 text-blue-500" />}
        title="Serial Output"
        description="Direct serial port communication"
        streamKey="serial"
        streamData={streams.serial}
      />

      <StreamCard
        icon={<Radio className="size-5 text-blue-500" />}
        title="RTCM Output"
        description="Correction message generation"
        streamKey="rtcm"
        streamData={streams.rtcm}
      >
        <div className="text-sm">
          Messages: {streams.rtcm.activeMessages.length > 0 ? streams.rtcm.activeMessages.join(", ") : 'NIL'}
        </div>
      </StreamCard>

      <StreamCard
        icon={<Wifi className="size-5 text-blue-500" />}
        title="NTRIP Caster"
        description="Network transport of RTCM corrections"
        streamKey="ntrip"
        streamData={streams.ntrip}
      >
        <div className="text-sm">
          Uptime: {streams.ntrip.uptime > 0 ? formatUptime(streams.ntrip.uptime) : 'NIL'}
        </div>
      </StreamCard>

      <StreamCard
        icon={<Server className="size-5 text-blue-500" />}
        title="TCP Server"
        description="TCP socket server"
        streamKey="tcp"
        streamData={streams.tcp}
      />

      <StreamCard
        icon={<Send className="size-5 text-blue-500" />}
        title="UDP Broadcast"
        description="UDP packet broadcasting"
        streamKey="udp"
        streamData={streams.udp}
      />

      <Card>
        <CardHeader>
          <CardTitle>Stream Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {activeCount}
            </div>
            <div className="text-xs">Active Streams</div>
          </div>

          <div>
            <div className="text-2xl font-bold">
              {totalThroughput.toFixed(0)} B/s
            </div>
            <div className="text-xs">Total Throughput</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamStatus;
