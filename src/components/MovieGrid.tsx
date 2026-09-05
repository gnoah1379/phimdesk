import { MovieCard } from "./MovieCard";
import type { MovieSummary } from "../lib/types";

export function MovieGrid({ movies }: { movies: MovieSummary[] }) {
  return (
    <div className="grid animate-fade-up grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6">
      {movies.map((movie) => (
        <MovieCard key={movie.slug} movie={movie} badge={movie.current_episode} />
      ))}
    </div>
  );
}
