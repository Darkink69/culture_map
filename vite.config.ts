import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/culture": {
        target: "https://www.culture.ru",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/culture/, ""),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          "Accept-Language": "ru-RU,ru;q=0.9",
        },
      },
      "/events": {
        target: "https://www.culture.ru",
        changeOrigin: true,
      },
    },
  },
});
