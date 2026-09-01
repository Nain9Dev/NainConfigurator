import { devices, defineConfig } from "@playwright/test";

/**
 * Cross-browser journeys for the offline demo mode.
 *
 * No SQL Server, no .NET host, no database: the shell serves the bundled
 * synthetic catalog and evaluates it in the browser. That is what makes these
 * journeys runnable in CI and on any contributor's machine, and it is the exact
 * configuration published to GitHub Pages.
 *
 * The full-stack journeys in `playwright.config.ts` stay part of the local
 * release gate, where a real database exists.
 */

const webUrl = "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /offline-demo\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "../artifacts/playwright-report",
      },
    ],
  ],
  use: {
    baseURL: webUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm run start -- --host 127.0.0.1 --port 4174",
    url: `${webUrl}/demo-scenarios.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      VITE_FORCE_OFFLINE: "true",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
