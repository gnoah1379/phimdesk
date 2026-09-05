import { Link } from "react-router-dom";
import { clearHistory, removeFromHistory, useFavorites, useHistory } from "../lib/storage";
import { MovieCard } from "../components/MovieCard";
import { EmptyState, SectionTitle } from "../components/ui";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6";

export function Favorites() {
  const favorites = useFavorites();

  return (
    <section>
      <SectionTitle>Yêu thích</SectionTitle>
      {favorites.length === 0 ? (
        <EmptyState>
          Chưa có phim nào.
          <Link to="/" className="text-brand-soft hover:underline">
            Khám phá phim mới
          </Link>
        </EmptyState>
      ) : (
        <div className={GRID}>
          {favorites.map((f) => (
            <MovieCard
              key={f.slug}
              movie={{ slug: f.slug, name: f.name }}
              thumb={f.thumb}
              subtitle={f.year}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function History() {
  const history = useHistory();
  const unique = history.filter((e, i, all) => all.findIndex((x) => x.slug === e.slug) === i);

  return (
    <section>
      <SectionTitle
        action={
          unique.length > 0 ? (
            <button onClick={clearHistory} className="text-xs text-zinc-500 hover:text-brand-soft">
              Xoá tất cả
            </button>
          ) : null
        }
      >
        Đang xem
      </SectionTitle>

      {unique.length === 0 ? (
        <EmptyState>Lịch sử xem sẽ xuất hiện ở đây sau khi bạn mở một tập phim.</EmptyState>
      ) : (
        <div className={GRID}>
          {unique.map((entry) => (
            <div key={entry.slug} className="group/item relative">
              <MovieCard
                movie={{ slug: entry.slug, name: entry.name }}
                thumb={entry.thumb}
                badge={entry.episodeName}
                progress={entry.duration > 0 ? entry.position / entry.duration : 0}
                subtitle={new Date(entry.updatedAt).toLocaleDateString("vi-VN")}
              />
              <button
                onClick={() => removeFromHistory(entry.slug)}
                title="Xoá khỏi lịch sử"
                className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-md bg-black/75 text-zinc-300 backdrop-blur transition hover:text-white group-hover/item:flex"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
