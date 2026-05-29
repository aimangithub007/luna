import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port backend:
//   8119 = standalone backend kita (./serve) — DEFAULT
//   9119 = hermes dashboard bawaan (BACKEND_PORT=9119 npm run dev)
const BACKEND_PORT = process.env.BACKEND_PORT || "8119";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${BACKEND_PORT}`,
        changeOrigin: true,
        ws: true,         // Enable WebSocket proxying (/api/pty)
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
