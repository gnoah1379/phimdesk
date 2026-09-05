export interface MovieSummary {
  name: string;
  slug: string;
  original_name: string;
  thumb_url: string;
  poster_url: string;
  created: string;
  modified: string;
  description: string;
  total_episodes: number;
  current_episode: string;
  time: string;
  quality: string;
  language: string;
  director: string | null;
  casts: string | null;
  year?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface CategoryGroup {
  group: { id: string; name: string };
  list: CategoryItem[];
}

export interface Episode {
  name: string;
  slug: string;
  embed: string;
  m3u8?: string;
}

export interface ServerGroup {
  server_name: string;
  items: Episode[];
}

export interface MovieDetail extends MovieSummary {
  id: string;
  category: Record<string, CategoryGroup>;
  episodes: ServerGroup[];
}

export interface Paginate {
  current_page: number;
  total_page: number;
  total_items: number;
  items_per_page: number;
}

export interface ListResponse {
  status: string;
  paginate: Paginate;
  items: MovieSummary[];
}
