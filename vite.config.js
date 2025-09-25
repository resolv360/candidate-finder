import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "",
    rollupOptions: {
      input: {
        main: "src/main.tsx",
        index: "index.html",
        background: "src/background.ts",
        "content-script": "src/content-script.ts",
      },
      output: {
        entryFileNames: "[name].js", // Use original entry names, no hash
        chunkFileNames: "[name].js", // For code-splitting chunks if any
        assetFileNames: "[name][extname]", // For assets like CSS, images
        sourcemap: true,
      },
    },
  },
});
