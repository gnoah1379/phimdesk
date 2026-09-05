import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { kindForGroup, slugify } from "../lib/catalog";
import { getLastWatched, toggleFavorite, useFavorites, useHistory } from "../lib/storage";
import { useAsync } from "../lib/useAsync";
import { ErrorState, Spinner } from "../components/ui";
import type { MovieDetail } from "../lib/types";

export function Detail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const favorites = useFavorites();
  useHistory(); // để nút "Xem tiếp" cập nhật khi quay lại từ trang xem

  const { data, error, loading } = useAsync((signal) => api.detail(slug, signal), [slug]);
  const movie = data?.movie;

  if (loading) return <Spinner label="Đang tải thông tin phim…" />;
  if (error || !movie) return <ErrorState message={error ?? "Không tìm thấy phim này"} />;

  const favorited = favorites.some((f) => f.slug === movie.slug);
  const last = getLastWatched(movie.slug);
  const firstEpisode = movie.episodes[0]?.items[0];
  const watchTarget = last
    ? `/xem/${movie.slug}?server=${last.serverIndex}&ep=${encodeURIComponent(last.episodeSlug)}`
    : firstEpisode
      ? `/xem/${movie.slug}?server=0&ep=${encodeURIComponent(firstEpisode.slug)}`
      : null;

  return (
    <article className="animate-fade-up space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-line">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[2px]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/40" />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row">
          <img
            src={movie.thumb_url}
            alt={movie.name}
            className="h-64 w-44 shrink-0 rounded-xl object-cover ring-1 ring-line"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">{movie.name}</h1>
            {movie.original_name ? (
              <p className="mt-0.5 text-sm text-zinc-500">{movie.original_name}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[movie.quality, movie.language, movie.time, movie.current_episode]
                .filter(Boolean)
                .map((chip) => (
                  <span key={chip} className="rounded-md bg-surface-3 px-2 py-1 text-zinc-300">
                    {chip}
                  </span>
                ))}
            </div>

            <CategoryLinks movie={movie} />

            <div className="mt-5 flex flex-wrap gap-3">
              {watchTarget ? (
                <button
                  onClick={() => navigate(watchTarget)}
                  className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/85"
                >
                  {last ? `Xem tiếp · ${last.episodeName}` : "Xem ngay"}
                </button>
              ) : (
                <span className="rounded-lg bg-surface-3 px-5 py-2 text-sm text-zinc-500">
                  Phim chưa có tập nào
                </span>
              )}

              <button
                onClick={() => toggleFavorite(movie)}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                  favorited
                    ? "bg-brand/15 text-brand-soft hover:bg-brand/25"
                    : "bg-surface-3 text-zinc-200 hover:bg-line"
                }`}
              >
                {favorited ? "Đã yêu thích" : "Yêu thích"}
              </button>
            </div>

            {movie.casts ? (
              <p className="mt-5 text-sm text-zinc-400">
                <span className="text-zinc-600">Diễn viên: </span>
                {movie.casts}
              </p>
            ) : null}
            {movie.director ? (
              <p className="mt-1 text-sm text-zinc-400">
                <span className="text-zinc-600">Đạo diễn: </span>
                {movie.director}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {movie.description ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">Nội dung</h2>
          <p className="max-w-4xl text-sm leading-relaxed text-zinc-400">{movie.description}</p>
        </section>
      ) : null}

      {movie.episodes.map((server, serverIndex) => (
        <section key={server.server_name}>
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">
            {server.server_name}
            <span className="ml-2 text-xs font-normal text-zinc-600">
              {server.items.length} tập
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {server.items.map((ep) => (
              <Link
                key={ep.slug}
                to={`/xem/${movie.slug}?server=${serverIndex}&ep=${encodeURIComponent(ep.slug)}`}
                className="rounded-lg bg-surface-2 px-3.5 py-2 text-sm text-zinc-300 ring-1 ring-line transition hover:bg-surface-3 hover:text-white"
              >
                {ep.name}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}

function CategoryLinks({ movie }: { movie: MovieDetail }) {
  const groups = Object.values(movie.category ?? {});
  if (groups.length === 0) return null;

  return (
    <div className="mt-4 space-y-1.5">
      {groups.map((group) => {
        const kind = kindForGroup(group.group.name);
        return (
          <div key={group.group.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs text-zinc-600">{group.group.name}:</span>
            {group.list.map((item) =>
              kind ? (
                <Link
                  key={item.id}
                  to={`/browse/${kind}/${slugify(item.name)}`}
                  className="text-xs text-zinc-300 underline-offset-2 hover:text-brand-soft hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <span key={item.id} className="text-xs text-zinc-300">
                  {item.name}
                </span>
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}
