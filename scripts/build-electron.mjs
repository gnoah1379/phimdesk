import { build } from "esbuild";

/** Main và preload đóng gói dạng CJS để chạy được với contextIsolation mặc định. */
export async function buildElectron() {
  await build({
    entryPoints: {
      main: "electron/main.ts",
      preload: "electron/preload.ts",
    },
    outdir: "dist-electron",
    outExtension: { ".js": ".cjs" },
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    external: ["electron"],
    sourcemap: true,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildElectron();
}
