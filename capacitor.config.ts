import type { CapacitorConfig } from "@capacitor/cli";

// Online-shared model: the Android WebView loads the deployed web app directly,
// so it shares the same backend/account as Web and Windows. Replace the URL
// after the first Cloudflare deploy.
const config: CapacitorConfig = {
  appId: "com.liory.tasks",
  appName: "Tasks",
  webDir: "public",
  server: {
    url: "https://REPLACE_WITH_DEPLOYED_URL",
    cleartext: false,
  },
};

export default config;
