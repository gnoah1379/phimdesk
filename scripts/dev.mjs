import { spawn } from "node:child_process";
import electronBinary from "electron";
import { createServer } from "vite";
import { buildElectron } from "./build-electron.mjs";

await buildElectron();

const server = await createServer();
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) throw new Error("Vite không trả về địa chỉ dev server");
server.printUrls();

const electron = spawn(electronBinary, ["."], {
  stdio: "inherit",
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
});

electron.on("close", async () => {
  await server.close();
  process.exit(0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => electron.kill());
}
