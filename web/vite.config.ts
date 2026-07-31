import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    setupFiles: ["./src/test-setup.ts"],
  },
  build: {
    sourcemap: false,
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5187",
      "/health": "http://127.0.0.1:5187",
    },
  },
});
