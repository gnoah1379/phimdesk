import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
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
import type { ListResponse } from "../lib/types";

const EMPTY: ListResponse = {
  status: "success",
  paginate: { current_page: 1, total_page: 1, total_items: 0, items_per_page: 10 },
  items: [],
};

export function Search() {
  const [params] = useSearchParams();
  const keyword = params.get("q")?.trim() ?? "";

  const list = useInfiniteList(
    (page, signal) => (keyword ? api.search(keyword, page, signal) : Promise.resolve(EMPTY)),
    [keyword],
  );

  if (!keyword) {
    return <EmptyState>Nhập tên phim vào ô tìm kiếm ở trên.</EmptyState>;
  }

  return (
    <section>
      <SectionTitle
        action={
          list.items.length > 0 ? (
            <span className="text-xs text-zinc-500">
              {list.totalItems.toLocaleString("vi-VN")} kết quả
            </span>
          ) : null
        }
      >
        Kết quả cho “{keyword}”
      </SectionTitle>

      {list.loading ? <SkeletonGrid count={12} /> : null}
      {list.error && list.items.length === 0 ? (
        <ErrorState message={list.error} onRetry={list.retry} />
      ) : null}
      {!list.loading && !list.error && list.items.length === 0 ? (
        <EmptyState>
          Không tìm thấy phim nào khớp với “{keyword}”.
          <span className="text-zinc-600">Thử từ khoá ngắn hơn hoặc tên gốc tiếng Anh.</span>
        </EmptyState>
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
