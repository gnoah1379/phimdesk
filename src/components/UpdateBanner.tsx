import { useEffect, useState } from "react";

const DISMISS_KEY = "phimdesk:update-dismissed";

export function UpdateBanner() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => window.phimdesk.onUpdateAvailable(setInfo), []);

  if (!info || localStorage.getItem(DISMISS_KEY) === info.version) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, info.version);
    setInfo(null);
  };

  return (
    <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2 text-sm">
      <span className="text-zinc-200">
        Đã có bản cập nhật <strong className="text-brand-soft">v{info.version}</strong>
      </span>
      <a
        href={info.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white transition hover:bg-brand/90"
      >
        Xem bản phát hành
      </a>
      <button
        onClick={dismiss}
        className="ml-auto text-xs text-zinc-500 transition hover:text-zinc-300"
      >
        Bỏ qua
      </button>
    </div>
  );
}
