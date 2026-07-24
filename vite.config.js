import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".vercel.run", "sb-6htz7hsmtytz.vercel.run"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("qr-code-styling")) {
              return "qr-engine"; // isolated so the builder page can lazy-load it if needed later
            }
            return "vendor";
          }
        },
      },
    },
  },
});