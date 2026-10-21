import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/upbit": {
        target: "https://api.upbit.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/upbit/, ""),
        configure: proxy => {
          proxy.on("proxyReq", request => {
            request.removeHeader("origin");
          });
        },
      },
    },
  },
});
