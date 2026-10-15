import { devices, defineConfig } from "@playwright/test";

// Reserved in eng/local-development.json.
const apiPort = Number(process.env.NAINCONFIGURATOR_API_PORT ?? 5187);
const webPort = Number(process.env.NAINCONFIGURATOR_E2E_PORT ?? 5183);
const apiUrl = `http://127.0.0.1:${apiPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /technical-demo\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
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
  webServer: [
    {
      command:
        '..\\.tools\\dotnet-sdk-10.0.302-win-x64\\dotnet.exe run --project "..\\backend\\src\\NainConfigurator.PublicHost\\NainConfigurator.PublicHost.csproj" --configuration Release --no-launch-profile',
      url: `${apiUrl}/health/ready`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        ASPNETCORE_URLS: apiUrl,
        DOTNET_ENVIRONMENT: "LocalDemo",
        Runtime__ReleaseId: "0.1.0-sl009-e2e",
      },
    },
    {
      command: `npm run start -- --host 127.0.0.1 --port ${webPort} --strictPort`,
      url: `${webUrl}/demo-scenarios.json`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
