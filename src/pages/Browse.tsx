import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { labelFor } from "../lib/catalog";
import { useInfiniteList } from "../lib/useInfiniteList";
import { MovieGrid } from "../components/MovieGrid";
import { InfiniteSentinel } from "../components/InfiniteSentinel";
import {
  EmptyState,
  ErrorState,
  LoadMoreStatus,
  SectionTitle,
  SkeletonGrid,
} from "../components/ui";

export function Browse() {
  const { kind = "", slug = "" } = useParams();

  const list = useInfiniteList(
    (page, signal) => api.list(kind, slug, page, signal),
    [kind, slug],
  );

  return (
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
        {labelFor(kind, slug)}
      </SectionTitle>

      {list.loading ? <SkeletonGrid /> : null}
      {list.error && list.items.length === 0 ? (
        <ErrorState message={list.error} onRetry={list.retry} />
      ) : null}
      {!list.loading && !list.error && list.items.length === 0 ? (
        <EmptyState>Danh mục này chưa có phim nào.</EmptyState>
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
  );
}
