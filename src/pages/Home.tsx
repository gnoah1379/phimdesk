import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useInfiniteList } from "../lib/useInfiniteList";
import { useHistory } from "../lib/storage";
import { MovieGrid } from "../components/MovieGrid";
import { MovieCard } from "../components/MovieCard";
import { InfiniteSentinel } from "../components/InfiniteSentinel";
import { ErrorState, LoadMoreStatus, SectionTitle, SkeletonGrid } from "../components/ui";

export function Home() {
  const list = useInfiniteList((page, signal) => api.latest(page, signal), []);
  const history = useHistory();

  const resume = history
    .filter((e, i, all) => all.findIndex((x) => x.slug === e.slug) === i)
    .slice(0, 6);

  return (
    <div className="space-y-10">
      {resume.length > 0 ? (
        <section>
          <SectionTitle
            action={
              <Link to="/lich-su" className="text-xs text-zinc-500 hover:text-brand-soft">
                Xem tất cả
              </Link>
            }
          >
            Tiếp tục xem
          </SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6">
            {resume.map((entry) => (
              <MovieCard
                key={entry.slug}
                movie={{ slug: entry.slug, name: entry.name }}
                thumb={entry.thumb}
                badge={entry.episodeName}
                subtitle={`Còn lại ${formatRemaining(entry.position, entry.duration)}`}
                progress={entry.duration > 0 ? entry.position / entry.duration : 0}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle
          action={
            list.items.length > 0 ? (
              <span className="text-xs text-zinc-500">
                {list.items.length.toLocaleString("vi-VN")} /{" "}
                {list.totalItems.toLocaleString("vi-VN")} phim
              </span>
            ) : null
          }
        >
          Phim mới cập nhật
        </SectionTitle>

        {list.loading ? <SkeletonGrid /> : null}
        {list.error && list.items.length === 0 ? (
          <ErrorState message={list.error} onRetry={list.retry} />
        ) : null}

        {list.items.length > 0 ? (
          <>
            <MovieGrid movies={list.items} />
            <InfiniteSentinel
              onReach={list.loadMore}
              disabled={list.loadingMore || !list.hasMore || list.error !== null}
            />
            <LoadMoreStatus
              loadingMore={list.loadingMore}
              hasMore={list.hasMore}
              error={list.error}
              onRetry={list.retry}
              count={list.items.length}
            />
          </>
        ) : null}
      </section>
    </div>
  );
}

function formatRemaining(position: number, duration: number): string {
  const left = Math.max(0, Math.round((duration - position) / 60));
  return left > 0 ? `${left} phút` : "vài giây";
}
