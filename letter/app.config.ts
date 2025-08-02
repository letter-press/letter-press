import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({

  ssr: true,
  vite: {
    ssr: { external: ["@prisma/client"] },
    plugins: [
      tailwindcss() as any
    ]
  },

  server: {
    preset: "cloudflare_module",
    compatibilityDate: "2025-07-19"
  }
});