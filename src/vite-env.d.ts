/// <reference types="vite/client" />

interface UpdateInfo {
  version: string;
  url: string;
  notes: string;
  publishedAt: string;
}

interface Window {
  phimdesk: {
    resolveStream(embedUrl: string): Promise<string>;
    checkForUpdate(): Promise<UpdateInfo | null>;
    onUpdateAvailable(callback: (info: UpdateInfo) => void): () => void;
  };
}
