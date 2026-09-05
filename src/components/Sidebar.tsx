import { NavLink } from "react-router-dom";
import { COUNTRIES, FORMATS, GENRES, YEARS, type NavEntry } from "../lib/catalog";

function itemClass({ isActive }: { isActive: boolean }) {
  return `block truncate rounded-lg px-3 py-1.5 text-sm transition ${
    isActive
      ? "bg-brand/15 font-medium text-brand-soft"
      : "text-zinc-400 hover:bg-surface-2 hover:text-zinc-100"
  }`;
}

function Section({ title, entries }: { title: string; entries: NavEntry[] }) {
  return (
    <div className="mt-6">
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        {title}
      </p>
      {entries.map((e) => (
        <NavLink key={`${e.kind}/${e.slug}`} to={`/browse/${e.kind}/${e.slug}`} className={itemClass}>
          {e.label}
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-line bg-surface">
      {/* pl-20 chừa chỗ cho nút đóng/thu nhỏ/phóng to của macOS trên thanh tiêu đề ẩn */}
      <div className="app-drag flex h-14 items-center gap-2 pl-20 pr-4">
        <span className="text-base font-bold tracking-tight text-white">
          Phim<span className="text-brand">Desk</span>
        </span>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-2 pb-8">
        <NavLink to="/" end className={itemClass}>
          Trang chủ
        </NavLink>
        <NavLink to="/lich-su" className={itemClass}>
          Đang xem
        </NavLink>
        <NavLink to="/yeu-thich" className={itemClass}>
          Yêu thích
        </NavLink>

        <Section title="Định dạng" entries={FORMATS} />
        <Section title="Thể loại" entries={GENRES} />
        <Section title="Quốc gia" entries={COUNTRIES} />
        <Section title="Năm phát hành" entries={YEARS} />
      </nav>
    </aside>
  );
}
