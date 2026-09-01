import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// VITE_BASE_PATH lets the same build serve from "/" behind the ASP.NET Core
// host and from "/<repo>/" on a static host such as GitHub Pages.
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
    // No source maps: the demo ships to a public host and the bundle should
    // not carry a full copy of the sources with it.
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5187",
      "/health": "http://127.0.0.1:5187",
    },
  },
});
