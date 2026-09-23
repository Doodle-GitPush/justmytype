import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ["gsap", "@gsap/react"],
          react: ["react", "react-dom", "react-dom/client"],
          ui: [
            "@radix-ui/react-accordion", "@radix-ui/react-dialog", "@radix-ui/react-popover",
            "@radix-ui/react-slider", "@radix-ui/react-switch", "@radix-ui/react-tabs", "cmdk",
          ],
        },
      },
    },
  },
})
