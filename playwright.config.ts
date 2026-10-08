import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3017",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node .output/server/index.mjs",
    url: "http://127.0.0.1:3017",
    reuseExistingServer: true,
    env: { PORT: "3017", HOST: "127.0.0.1" },
    timeout: 30000,
  },
});
