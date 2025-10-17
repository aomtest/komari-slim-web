import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Pages from "vite-plugin-pages";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
import type { UserConfig } from "vite";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

export default defineConfig(({ mode }) => {
  const buildTime = new Date().toISOString();

  const baseConfig: UserConfig = {
    plugins: [
      react(),
      tailwindcss(),
      Pages({
        dirs: "src/pages",
        extensions: ["tsx", "jsx"],
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "assets/pwa-icon.png"],
        manifest: {
          name: "Komari Monitor",
          short_name: "Komari Monitor",
          description: "A simple server monitor tool",
          theme_color: "#2563eb",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/assets/pwa-icon.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "/assets/pwa-icon.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      visualizer({
        open: false,
        filename: "bundle-analysis.html",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      assetsDir: "assets",
      outDir: "dist",
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // go embed ignore files start with '_'
          chunkFileNames: "assets/chunk-[name]-[hash].js",
          entryFileNames: "assets/entry-[name]-[hash].js",
          // More granular vendor splitting to improve caching and reduce initial chunks
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;

            // React core + router
            if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) {
              return "react";
            }
            // i18n related
            if (id.includes("i18n")) {
              return "i18n";
            }
            // Radix UI (themes + primitives)
            if (/node_modules\/(@radix-ui)\//.test(id)) {
              return "radix";
            }
            // Icon library
            if (/node_modules\/(lucide-react)\//.test(id)) {
              return "icons";
            }
            // Charts
            if (id.includes("chart")) {
              return "charts";
            }
            // xterm
            if (id.includes("xterm")) {
              return "xterm";
            }
            // dnd-kit
            if (/node_modules\/(@dnd-kit)\//.test(id)) {
              return "dndkit";
            }
            // framer-motion
            if (id.includes("motion")) {
              return "framer-motion";
            }
            // lodash
            if (/node_modules\/(lodash|lodash-es)\//.test(id)) {
              return "lodash-vendor";
            }
            // decimal.js
            if (/node_modules\/(decimal.js)\//.test(id)) {
              return "decimaljs";
            }
            //sonner
            if (/node_modules\/(sonner)\//.test(id)) {
              return "sonner";
            }
            //mdast-util
            if (id.includes("mdast-util-")) {
              return "mdast-util";
            }
            // tailwind
            if (id.includes("tailwind")) {
              return "tailwind";
            }
            // Fallback: group remaining deps to general vendor
            return "vendor-" + id.split("node_modules/")[1][0];
          },
        },
      },
    },
  };

  if (mode === "development") {
    const envPath = path.resolve(process.cwd(), ".env.development");
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    }
    if (!process.env.VITE_API_TARGET) {
      process.env.VITE_API_TARGET = "http://127.0.0.1:25774";
    }
    baseConfig.server = {
      proxy: {
        "/api": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
          rewriteWsOrigin: true,
          ws: true,
        },
        "/themes": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
        },
      },
    };
  }

  return baseConfig;
});
