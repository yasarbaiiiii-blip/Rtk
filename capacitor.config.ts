import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rtk.app",
  appName: "RTK",
  webDir: "dist",

  server: {
    cleartext: true,
    androidScheme: "http"
  }
};

export default config;

