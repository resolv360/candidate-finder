import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    assetsDir: "",
    rollupOptions: {
      input: {
        app: "src/webpage/app.ts",
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
