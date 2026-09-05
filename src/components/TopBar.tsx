import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");

  const activeQuery = location.pathname === "/tim-kiem" ? (params.get("q") ?? "") : "";
  useEffect(() => setQuery(activeQuery), [activeQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = query.trim();
    if (keyword) navigate(`/tim-kiem?q=${encodeURIComponent(keyword)}`);
  };

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-zinc-400 transition hover:bg-surface-3 hover:text-zinc-100";

  return (
    <header
      className="app-drag sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-6 backdrop-blur"
    >
      <button className={navBtn} onClick={() => navigate(-1)} title="Quay lại">
        ‹
      </button>
      <button className={navBtn} onClick={() => navigate(1)} title="Tiến tới">
        ›
      </button>

      <form onSubmit={submit} className="ml-2 max-w-md flex-1">
        <input
          id="global-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm phim theo tên…  (⌘F)"
          className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60 focus:outline-none"
        />
      </form>
    </header>
  );
}
