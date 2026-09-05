import { app } from "electron";

/**
 * Không có chứng chỉ Apple Developer ID / Windows code signing nên không thể dùng
 * electron-updater (Squirrel.Mac bắt buộc ứng dụng phải được ký, nếu không sẽ báo lỗi
 * ngay khi gọi checkForUpdates). Thay vào đó, chỉ so sánh phiên bản với GitHub Releases
 * và báo cho người dùng biết — họ tự tải bản cài đặt mới, không tự cài ngầm.
 */
const REPO = "gnoah1379/phimdesk";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

export interface UpdateInfo {
  version: string;
  url: string;
  notes: string;
  publishedAt: string;
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
  body: string | null;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
}

function parseVersion(tag: string): number[] {
  return tag
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number(part) || 0);
}

function isNewer(remote: string, local: string): boolean {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const res = await fetch(API_URL, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "PhimDesk" },
  });
  if (!res.ok) throw new Error(`GitHub trả về ${res.status}`);

  const release = (await res.json()) as GithubRelease;
  if (release.draft || release.prerelease) return null;

  if (!isNewer(release.tag_name, app.getVersion())) return null;

  return {
    version: release.tag_name.replace(/^v/i, ""),
    url: release.html_url,
    notes: release.body ?? "",
    publishedAt: release.published_at,
  };
}
