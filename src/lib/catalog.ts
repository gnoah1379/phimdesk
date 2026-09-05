export interface NavEntry {
  kind: "danh-sach" | "the-loai" | "quoc-gia" | "nam-phat-hanh";
  slug: string;
  label: string;
}

export const FORMATS: NavEntry[] = [
  { kind: "danh-sach", slug: "phim-le", label: "Phim lẻ" },
  { kind: "danh-sach", slug: "phim-bo", label: "Phim bộ" },
  { kind: "danh-sach", slug: "hoat-hinh", label: "Hoạt hình" },
  { kind: "danh-sach", slug: "tv-shows", label: "TV Shows" },
  { kind: "danh-sach", slug: "dang-chieu", label: "Đang chiếu" },
];

export const GENRES: NavEntry[] = [
  ["hanh-dong", "Hành động"],
  ["tinh-cam", "Tình cảm"],
  ["phim-hai", "Hài"],
  ["chinh-kich", "Chính kịch"],
  ["kinh-di", "Kinh dị"],
  ["hinh-su", "Hình sự"],
  ["co-trang", "Cổ trang"],
  ["gay-can", "Gây cấn"],
  ["phieu-luu", "Phiêu lưu"],
  ["bi-an", "Bí ẩn"],
  ["gia-tuong", "Giả tưởng"],
  ["khoa-hoc-vien-tuong", "Khoa học viễn tưởng"],
  ["lang-man", "Lãng mạn"],
  ["tam-ly", "Tâm lý"],
  ["gia-dinh", "Gia đình"],
  ["chien-tranh", "Chiến tranh"],
  ["lich-su", "Lịch sử"],
  ["tai-lieu", "Tài liệu"],
  ["phim-nhac", "Nhạc"],
  ["mien-tay", "Miền tây"],
].map(([slug, label]) => ({ kind: "the-loai" as const, slug, label }));

export const COUNTRIES: NavEntry[] = [
  ["au-my", "Âu Mỹ"],
  ["han-quoc", "Hàn Quốc"],
  ["trung-quoc", "Trung Quốc"],
  ["nhat-ban", "Nhật Bản"],
  ["thai-lan", "Thái Lan"],
  ["hong-kong", "Hồng Kông"],
  ["dai-loan", "Đài Loan"],
  ["an-do", "Ấn Độ"],
  ["anh", "Anh"],
  ["phap", "Pháp"],
  ["dan-mach", "Đan Mạch"],
  ["quoc-gia-khac", "Quốc gia khác"],
].map(([slug, label]) => ({ kind: "quoc-gia" as const, slug, label }));

const THIS_YEAR = new Date().getFullYear();
export const YEARS: NavEntry[] = Array.from({ length: 12 }, (_, i) => {
  const year = String(THIS_YEAR - i);
  return { kind: "nam-phat-hanh" as const, slug: year, label: year };
});

const ALL = [...FORMATS, ...GENRES, ...COUNTRIES];

const GROUP_TO_KIND: Record<string, NavEntry["kind"]> = {
  "Định dạng": "danh-sach",
  "Thể loại": "the-loai",
  "Quốc gia": "quoc-gia",
  Năm: "nam-phat-hanh",
};

export function kindForGroup(groupName: string): NavEntry["kind"] | null {
  return GROUP_TO_KIND[groupName] ?? null;
}

export function slugify(input: string): string {
  return input
    .replace(/[Đđ]/g, (c) => (c === "Đ" ? "D" : "d"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function labelFor(kind: string, slug: string): string {
  if (kind === "nam-phat-hanh") return `Năm ${slug}`;
  return ALL.find((e) => e.kind === kind && e.slug === slug)?.label ?? slug;
}
