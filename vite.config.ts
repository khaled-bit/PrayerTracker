import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Only include Replit plugins in development
    ...(process.env.NODE_ENV === "development" && process.env.REPL_ID
      ? [
          // Dynamically import Replit plugins only when needed
          (async () => {
            try {
              const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
              const { cartographer } = await import("@replit/vite-plugin-cartographer");
              return [runtimeErrorOverlay(), cartographer()];
            } catch {
              return [];
            }
          })(),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
