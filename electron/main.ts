import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { installStreamHeaderRules, resolveStream } from "./stream";
import { checkForUpdate } from "./updater";

const devServerUrl = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "PhimDesk",
    backgroundColor: "#0b0c0f",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  installStreamHeaderRules(win.webContents.session);

  // Link ngoài mở bằng trình duyệt hệ thống thay vì tạo cửa sổ Electron mới.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (devServerUrl) {
    void win.loadURL(devServerUrl);
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Chờ giao diện ổn định rồi mới hỏi GitHub, tránh chặn lúc khởi động và
  // tránh làm phiền nếu người dùng không có mạng.
  setTimeout(() => {
    checkForUpdate()
      .then((info) => {
        if (info) win.webContents.send("update-available", info);
      })
      .catch(() => {
        /* Không có mạng hoặc GitHub API lỗi: bỏ qua âm thầm, không làm phiền người dùng. */
      });
  }, 4000);
}

ipcMain.handle("resolve-stream", async (_event, embedUrl: string) => resolveStream(embedUrl));
ipcMain.handle("check-for-update", () => checkForUpdate());

void app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
