import { Link } from "react-router-dom";
import type { MovieSummary } from "../lib/types";

interface Props {
  movie: Pick<MovieSummary, "slug" | "name"> & Partial<MovieSummary>;
  thumb?: string;
  badge?: string;
  progress?: number;
  subtitle?: string;
}

export function MovieCard({ movie, thumb, badge, progress, subtitle }: Props) {
  const image = thumb ?? movie.thumb_url ?? movie.poster_url ?? "";

  return (
    <Link
      to={`/phim/${movie.slug}`}
      className="group block focus:outline-none"
      title={movie.name}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line transition group-hover:ring-brand/70 group-focus-visible:ring-brand">
        {image ? (
          <img
            src={image}
            alt={movie.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        {badge ? (
          <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-brand-soft backdrop-blur">
            {badge}
          </span>
        ) : null}

        {movie.quality ? (
          <span className="absolute right-2 top-2 rounded-md bg-brand/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {movie.quality}
          </span>
        ) : null}

        {progress !== undefined && progress > 0 ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div
              className="h-full bg-brand"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-medium text-zinc-100 group-hover:text-white">
          {movie.name}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {subtitle ?? [movie.year, movie.original_name].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
