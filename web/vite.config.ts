import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Ports and hostname come from `eng/local-development.json`, which reserves one
 * contiguous block for this repository.
 *
 * Two Vite projects that both take the default 5173 do not merely collide on a
 * socket: they share the `http://localhost:5173` browser origin, and therefore
 * share localStorage, sessionStorage, service workers and cookies. One project
 * then appears to overwrite the other. `strictPort` makes that failure loud
 * instead of silent, and the dedicated `*.localhost` hostname gives this project
 * an origin of its own even if a port is ever reused.
 */
const DEV_PORT = Number(process.env.NAINCONFIGURATOR_WEB_PORT ?? 5180);
const PREVIEW_PORT = Number(
  process.env.NAINCONFIGURATOR_WEB_PREVIEW_PORT ?? 5181,
);
const API_PORT = Number(process.env.NAINCONFIGURATOR_API_PORT ?? 5187);
const API_ORIGIN = `http://127.0.0.1:${API_PORT}`;

// VITE_BASE_PATH lets one build serve from "/" behind the ASP.NET Core host and
// from "/<repo>/" on a static host such as GitHub Pages.
const basePath = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/main.tsx", "src/vite-env.d.ts"],
    },
  },
  build: {
    // No source maps: the demo ships to a public host and the bundle should not
    // carry a full copy of the sources with it.
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "react";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: DEV_PORT,
    // Refuse to start rather than drift onto a neighbouring project's port.
    strictPort: true,
    allowedHosts: ["localhost", "nainconfigurator.localhost"],
    proxy: {
      "/api": API_ORIGIN,
      "/health": API_ORIGIN,
    },
  },
  preview: {
    host: "127.0.0.1",
    port: PREVIEW_PORT,
    strictPort: true,
    allowedHosts: ["localhost", "nainconfigurator.localhost"],
    proxy: {
      "/api": API_ORIGIN,
      "/health": API_ORIGIN,
    },
  },
});
