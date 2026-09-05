import { useCallback, useEffect, useRef, useState } from "react";
import type { ListResponse, MovieSummary } from "./types";

export type PageFetcher = (page: number, signal: AbortSignal) => Promise<ListResponse>;

/** Nguồn chỉ trả 10 phim mỗi trang nên mỗi lượt tải phải gộp nhiều trang. */
const FIRST_BATCH = 6; // 60 phim cho màn hình đầu
const NEXT_BATCH = 4; // 40 phim mỗi lần cuộn tới đáy

interface State {
  items: MovieSummary[];
  totalItems: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface InfiniteList extends State {
  loadMore: () => void;
  retry: () => void;
}

const INITIAL: State = {
  items: [],
  totalItems: 0,
  loading: true,
  loadingMore: false,
  error: null,
  hasMore: false,
};

function pagesFrom(start: number, count: number, last: number): number[] {
  const pages: number[] = [];
  for (let page = start; page < start + count && page <= last; page++) pages.push(page);
  return pages;
}

export function useInfiniteList(fetchPage: PageFetcher, deps: unknown[]): InfiniteList {
  const [state, setState] = useState<State>(INITIAL);
  const [attempt, setAttempt] = useState(0);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const nextPage = useRef(1);
  const lastPage = useRef(Number.POSITIVE_INFINITY);
  const busy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const load = useCallback(async (count: number, first: boolean) => {
    const signal = abort.current?.signal;
    if (busy.current || !signal || signal.aborted) return;
    busy.current = true;
    setState((s) => (first ? INITIAL : { ...s, loadingMore: true, error: null }));

    try {
      let responses: ListResponse[];

      if (first) {
        // Trang đầu cho biết tổng số trang, rồi mới tải song song phần còn lại
        // để không bắn request vào những trang không tồn tại.
        const head = await fetchRef.current(1, signal);
        lastPage.current = Math.max(1, head.paginate.total_page);
        const tail = await Promise.all(
          pagesFrom(2, count - 1, lastPage.current).map((page) => fetchRef.current(page, signal)),
        );
        responses = [head, ...tail];
      } else {
        const pages = pagesFrom(nextPage.current, count, lastPage.current);
        if (pages.length === 0) {
          setState((s) => ({ ...s, loadingMore: false, hasMore: false }));
          return;
        }
        responses = await Promise.all(pages.map((page) => fetchRef.current(page, signal)));
      }

      if (signal.aborted) return;

      const fresh: MovieSummary[] = [];
      for (const response of responses) {
        for (const item of response.items) {
          // Nguồn cập nhật liên tục nên các trang liền nhau có thể trùng phim.
          if (seen.current.has(item.slug)) continue;
          seen.current.add(item.slug);
          fresh.push(item);
        }
      }
      nextPage.current += responses.length;

      setState((s) => ({
        items: first ? fresh : [...s.items, ...fresh],
        totalItems: first ? (responses[0]?.paginate.total_items ?? fresh.length) : s.totalItems,
        loading: false,
        loadingMore: false,
        error: null,
        hasMore: nextPage.current <= lastPage.current,
      }));
    } catch (err: unknown) {
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
      setState((s) => ({ ...s, loading: false, loadingMore: false, error: message }));
    } finally {
      // Chỉ nhả khoá nếu lượt tải này vẫn là lượt hiện hành.
      if (abort.current?.signal === signal) busy.current = false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    nextPage.current = 1;
    lastPage.current = Number.POSITIVE_INFINITY;
    seen.current = new Set();
    busy.current = false;
    void load(FIRST_BATCH, true);

    return () => {
      controller.abort();
      busy.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const loadMore = useCallback(() => {
    if (busy.current || state.error !== null) return;
    if (nextPage.current > lastPage.current) return;
    void load(NEXT_BATCH, false);
  }, [load, state.error]);

  const retry = useCallback(() => {
    // Lỗi ngay từ lô đầu thì tải lại từ đầu, lỗi giữa chừng thì chỉ thử lại lô đang dở.
    if (state.items.length === 0) setAttempt((a) => a + 1);
    else void load(NEXT_BATCH, false);
  }, [load, state.items.length]);

  return { ...state, loadMore, retry };
}
