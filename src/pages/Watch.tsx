import { useCallback, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { getProgress, saveProgress } from "../lib/storage";
import { useAsync } from "../lib/useAsync";
import { Player } from "../components/Player";
import { ErrorState, Spinner } from "../components/ui";

export function Watch() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const serverIndex = Math.max(0, Number(params.get("server") ?? 0) || 0);
  const episodeSlug = params.get("ep") ?? "";

  const { data, error, loading } = useAsync((signal) => api.detail(slug, signal), [slug]);
  const movie = data?.movie;

  const server = movie?.episodes[serverIndex] ?? movie?.episodes[0];
  const episodeIndex = useMemo(
    () => server?.items.findIndex((e) => e.slug === episodeSlug) ?? -1,
    [server, episodeSlug],
  );
  const episode = episodeIndex >= 0 ? server?.items[episodeIndex] : server?.items[0];

  const startAt = episode ? (getProgress(slug, episode.slug)?.position ?? 0) : 0;

  const onProgress = useCallback(
    (position: number, duration: number) => {
      if (!movie || !episode) return;
      saveProgress({
        slug: movie.slug,
        name: movie.name,
        thumb: movie.thumb_url,
        serverIndex,
        episodeSlug: episode.slug,
        episodeName: episode.name.match(/^\d+$/) ? `Tập ${episode.name}` : episode.name,
        position,
        duration,
        updatedAt: Date.now(),
      });
    },
    [movie, episode, serverIndex],
  );

  const select = (nextServer: number, nextEpisode: string) => {
    setParams({ server: String(nextServer), ep: nextEpisode });
  };

  const onEnded = useCallback(() => {
    const next = server?.items[episodeIndex + 1];
    if (next) select(serverIndex, next.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, episodeIndex, serverIndex]);

  if (loading) return <Spinner label="Đang tải tập phim…" />;
  if (error || !movie) return <ErrorState message={error ?? "Không tải được phim"} />;
  if (!server || !episode) {
    return <ErrorState message="Phim này hiện chưa có tập nào để xem" />;
  }

  const previous = episodeIndex > 0 ? server.items[episodeIndex - 1] : null;
  const next = server.items[episodeIndex + 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/phim/${movie.slug}`}
            className="text-lg font-semibold text-white hover:text-brand-soft"
          >
            {movie.name}
          </Link>
          <p className="text-sm text-zinc-500">
            {server.server_name} · Tập {episode.name}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            disabled={!previous}
            onClick={() => previous && select(serverIndex, previous.slug)}
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-surface-3 disabled:opacity-35"
          >
            Tập trước
          </button>
          <button
            disabled={!next}
            onClick={() => next && select(serverIndex, next.slug)}
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-surface-3 disabled:opacity-35"
          >
            Tập sau
          </button>
        </div>
      </div>

      <Player
        key={`${serverIndex}:${episode.slug}`}
        embedUrl={episode.embed}
        poster={movie.poster_url}
        startAt={startAt}
        onProgress={onProgress}
        onEnded={onEnded}
      />

      {movie.episodes.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {movie.episodes.map((s, i) => (
            <button
              key={s.server_name}
              onClick={() => select(i, s.items[0]?.slug ?? "")}
              className={`rounded-lg px-3.5 py-1.5 text-sm transition ${
                i === serverIndex
                  ? "bg-brand font-medium text-white"
                  : "bg-surface-2 text-zinc-300 hover:bg-surface-3"
              }`}
            >
              {s.server_name}
            </button>
          ))}
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Danh sách tập
        </h2>
        <div className="flex flex-wrap gap-2">
          {server.items.map((e) => (
            <button
              key={e.slug}
              onClick={() => select(serverIndex, e.slug)}
              className={`min-w-11 rounded-lg px-3 py-2 text-sm transition ${
                e.slug === episode.slug
                  ? "bg-brand font-semibold text-white"
                  : "bg-surface-2 text-zinc-300 ring-1 ring-line hover:bg-surface-3 hover:text-white"
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={() => navigate(`/phim/${movie.slug}`)}
        className="text-sm text-zinc-500 hover:text-brand-soft"
      >
        ← Về trang phim
      </button>
    </div>
  );
}
