import type { ReactNode } from "react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <p className="text-sm text-zinc-400">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-lg bg-surface-3 px-4 py-2 text-sm text-zinc-200 transition hover:bg-line"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

export function SkeletonGrid({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-surface-2" />
          <div className="mt-2 h-3 w-4/5 rounded bg-surface-2" />
          <div className="mt-1.5 h-2.5 w-2/5 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export function LoadMoreStatus({
  loadingMore,
  hasMore,
  error,
  onRetry,
  count,
}: {
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onRetry: () => void;
  count: number;
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-surface-3 px-4 py-2 text-sm text-zinc-200 transition hover:bg-line"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (loadingMore) {
    return (
      <div className="flex items-center justify-center gap-3 py-10 text-sm text-zinc-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
        Đang tải thêm…
      </div>
    );
  }

  if (!hasMore && count > 0) {
    return (
      <p className="py-10 text-center text-xs text-zinc-600">
        Đã hiển thị hết {count.toLocaleString("vi-VN")} phim
      </p>
    );
  }

  return null;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{children}</h2>
      {action}
    </div>
  );
}
