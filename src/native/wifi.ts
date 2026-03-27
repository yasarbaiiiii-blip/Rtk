import { Capacitor } from "@capacitor/core";
import { CapacitorWifi } from "@capgo/capacitor-wifi";

export interface NativeWifiNetwork {
  ssid: string;
  signalStrength: number;
  secured: boolean;
}

export interface CurrentWifiInfo {
  ssid: string;
  ip: string;
}

async function ensureWifiPermission() {
  if (!Capacitor.isNativePlatform()) return;

  const perm = await CapacitorWifi.checkPermissions();

  if (perm.location !== "granted") {
    await CapacitorWifi.requestPermissions();
  }
}

export async function scanWifi(): Promise<NativeWifiNetwork[]> {
  if (!Capacitor.isNativePlatform()) return [];

  await ensureWifiPermission();

  const result: any = await CapacitorWifi.getAvailableNetworks();

  const networks = Array.isArray(result?.networks)
    ? result.networks
    : Array.isArray(result)
    ? result
    : [];

  return networks
    .filter((n: any) => typeof n.ssid === "string" && n.ssid.length > 0)
    .map((n: any) => ({
      ssid: n.ssid,
      signalStrength: n.level ?? n.signalLevel ?? 0,
      secured:
        n.security !== "NONE" &&
        n.security !== "OPEN" &&
        n.capabilities !== "[]",
    }));
}

export async function getCurrentWifiInfo(): Promise<CurrentWifiInfo | null> {
  if (!Capacitor.isNativePlatform()) return null;

  await ensureWifiPermission();

  try {
    const info = await CapacitorWifi.getWifiInfo();
    return {
      ssid: info?.ssid ?? "",
      ip: info?.ip ?? "",
    };
  } catch {
    try {
      const ipResult = await CapacitorWifi.getIpAddress();
      const ssidResult = await CapacitorWifi.getSsid();
      return {
        ssid: ssidResult?.ssid ?? "",
        ip: ipResult?.ipAddress ?? "",
      };
    } catch {
      return null;
    }
  }
}

export async function connectWifi(
  ssid: string,
  password?: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  await ensureWifiPermission();

  await CapacitorWifi.connect({
    ssid,
    password,
  });

  return true;
}
