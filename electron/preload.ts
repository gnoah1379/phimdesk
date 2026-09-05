import { contextBridge, ipcRenderer } from "electron";
import type { UpdateInfo } from "./updater";

contextBridge.exposeInMainWorld("phimdesk", {
  resolveStream: (embedUrl: string): Promise<string> =>
    ipcRenderer.invoke("resolve-stream", embedUrl),

  checkForUpdate: (): Promise<UpdateInfo | null> => ipcRenderer.invoke("check-for-update"),

  onUpdateAvailable: (callback: (info: UpdateInfo) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info);
    ipcRenderer.on("update-available", listener);
    return () => ipcRenderer.removeListener("update-available", listener);
  },
});
