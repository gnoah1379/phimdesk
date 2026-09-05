import { useSyncExternalStore } from "react";
import type { MovieDetail, MovieSummary } from "./types";

export interface WatchEntry {
  slug: string;
  name: string;
  thumb: string;
  serverIndex: number;
  episodeSlug: string;
  episodeName: string;
  position: number;
  duration: number;
  updatedAt: number;
}

export interface FavoriteEntry {
  slug: string;
  name: string;
  thumb: string;
  year: string;
  addedAt: number;
}

const HISTORY_KEY = "phimdesk:history";
const FAVORITES_KEY = "phimdesk:favorites";
const HISTORY_LIMIT = 120;

const listeners = new Set<() => void>();

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

// useSyncExternalStore so sánh bằng tham chiếu, nên cache mảng cho tới khi ghi.
const snapshots = new Map<string, unknown[]>();

function snapshot<T>(key: string): T[] {
  let cached = snapshots.get(key) as T[] | undefined;
  if (!cached) {
    cached = read<T>(key);
    snapshots.set(key, cached);
  }
  return cached;
}

function write<T>(key: string, value: T[]) {
  snapshots.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* hết dung lượng thì bỏ qua, dữ liệu vẫn còn trong phiên */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useHistory(): WatchEntry[] {
  return useSyncExternalStore(subscribe, () => snapshot<WatchEntry>(HISTORY_KEY));
}

export function useFavorites(): FavoriteEntry[] {
  return useSyncExternalStore(subscribe, () => snapshot<FavoriteEntry>(FAVORITES_KEY));
}

export function getProgress(slug: string, episodeSlug: string): WatchEntry | undefined {
  return snapshot<WatchEntry>(HISTORY_KEY).find(
    (e) => e.slug === slug && e.episodeSlug === episodeSlug,
  );
}

export function getLastWatched(slug: string): WatchEntry | undefined {
  return snapshot<WatchEntry>(HISTORY_KEY).find((e) => e.slug === slug);
}

export function saveProgress(entry: WatchEntry) {
  const rest = snapshot<WatchEntry>(HISTORY_KEY).filter(
    (e) => !(e.slug === entry.slug && e.episodeSlug === entry.episodeSlug),
  );
  write(HISTORY_KEY, [entry, ...rest].slice(0, HISTORY_LIMIT));
}

export function removeFromHistory(slug: string) {
  write(
    HISTORY_KEY,
    snapshot<WatchEntry>(HISTORY_KEY).filter((e) => e.slug !== slug),
  );
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

export function toggleFavorite(movie: MovieSummary | MovieDetail) {
  const current = snapshot<FavoriteEntry>(FAVORITES_KEY);
  if (current.some((e) => e.slug === movie.slug)) {
    write(
      FAVORITES_KEY,
      current.filter((e) => e.slug !== movie.slug),
    );
    return;
  }
  const entry: FavoriteEntry = {
    slug: movie.slug,
    name: movie.name,
    thumb: movie.thumb_url,
    year: movie.year ?? "",
    addedAt: Date.now(),
  };
  write(FAVORITES_KEY, [entry, ...current]);
}
