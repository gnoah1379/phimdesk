import { build } from "esbuild";
import { pathToFileURL } from "node:url";

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

// So khớp qua pathToFileURL để ra đúng định dạng file:// trên mọi hệ điều
// hành — ghép chuỗi thủ công (file://${process.argv[1]}) sai trên Windows vì
// process.argv[1] dùng dấu \ trong khi import.meta.url luôn dùng dấu /.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildElectron();
}
