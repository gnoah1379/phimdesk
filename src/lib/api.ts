import type { ListResponse, MovieDetail } from "./types";

const BASE = "https://phim.nguonc.com/api";
const TTL = 5 * 60 * 1000;

type CacheEntry = { at: number; data: unknown };
const cache = new Map<string, CacheEntry>();

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
    try {
      const res = await fetch(`${BASE}${path}`, { signal });
      if (!res.ok) throw new Error(`Máy chủ trả về ${res.status}`);
      const data = (await res.json()) as T & { status?: string };
      if (data.status && data.status !== "success") {
        throw new Error("Không tìm thấy dữ liệu cho mục này");
      }
      cache.set(path, { at: Date.now(), data });
      return data;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Không kết nối được tới nguồn phim");
}

export const api = {
  latest: (page: number, signal?: AbortSignal) =>
    request<ListResponse>(`/films/phim-moi-cap-nhat?page=${page}`, signal),

  list: (kind: string, slug: string, page: number, signal?: AbortSignal) =>
    request<ListResponse>(`/films/${kind}/${encodeURIComponent(slug)}?page=${page}`, signal),

  search: (keyword: string, page: number, signal?: AbortSignal) =>
    request<ListResponse>(
      `/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
      signal,
    ),

  detail: (slug: string, signal?: AbortSignal) =>
    request<{ status: string; movie: MovieDetail }>(`/film/${encodeURIComponent(slug)}`, signal),
};
