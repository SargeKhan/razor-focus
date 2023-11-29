import { defineConfig } from "tsup";
import { copyFile } from "node:fs/promises";

const TARGET = process.env.TARGET as "chrome" | "firefox";

export default defineConfig({
  clean: true,
  entry: [
    "src/background.ts",
    "src/blocked.ts",
    "src/options.ts",
    "src/content.ts",
  ],
  env: { TARGET },
  outDir: `dist/${TARGET}`,
  target: "es2022",
  format: "esm",
  treeshake: true,
  noExternal: ["dayjs", "firebase", "utils"],
  esbuildOptions(options) {
    options.chunkNames = "chunks/[name]-[hash]";
  },
  onSuccess: () => new Promise((resolve, reject) => {
    const files = [
      "icon_32.png",
      "icon_128.png",
      "common.css",
      "blocked.css",
      "blocked.html",
      "options.css",
      "content.css",
      "options.html",
      "blocked_page.html",
      "d3.v6.min.js",
      "blocked_page.js",
      `manifest-${TARGET}.json`,
    ];

    const copyFilesPromises = files.map((file) => (
      copyFile(`public/${file}`, `dist/${TARGET}/${file.replace(`-${TARGET}`, "")}`)
    ));

    Promise.all(copyFilesPromises).then(() => resolve()).catch(reject);
  })
});
