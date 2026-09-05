import type { Session } from "electron";

/** Nguồn chỉ trả playlist HLS không mã hoá khi client tự nhận là Safari/macOS. */
const APPLE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

/** Các host phục vụ playlist/segment, kèm Referer mà host đó đòi hỏi. */
const streamHosts = new Map<string, string>();

/**
 * CDN chặn request thiếu Referer và không trả header CORS, nên phải sửa header
 * ở tiến trình chính thay vì dựng proxy riêng.
 */
export function installStreamHeaderRules(session: Session) {
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    const referer = refererFor(details.url);
    if (!referer) return callback({ requestHeaders: details.requestHeaders });

    const headers = { ...details.requestHeaders };
    headers["User-Agent"] = APPLE_UA;
    headers["Referer"] = referer;
    delete headers["Origin"];
    callback({ requestHeaders: headers });
  });

  session.webRequest.onHeadersReceived((details, callback) => {
    if (!refererFor(details.url)) return callback({ responseHeaders: details.responseHeaders });

    const headers = { ...details.responseHeaders };
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === "access-control-allow-origin") delete headers[key];
    }
    headers["Access-Control-Allow-Origin"] = ["*"];
    callback({ responseHeaders: headers });
  });
}

function refererFor(rawUrl: string): string | undefined {
  try {
    return streamHosts.get(new URL(rawUrl).hostname);
  } catch {
    return undefined;
  }
}

async function fetchAsSafari(url: string, referer: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": APPLE_UA, Referer: referer },
  });
  if (!res.ok) throw new Error(`nguồn trả về ${res.status}`);
  return res.text();
}

/**
 * Trang embed nhúng một chuỗi base64 chứa đường dẫn playlist. Với User-Agent
 * macOS, nguồn phục vụ bản HLS thường thay vì bản đã xáo trộn cho player web.
 */
export async function resolveStream(embedUrl: string): Promise<string> {
  const embed = new URL(embedUrl);
  const referer = `${embed.protocol}//${embed.host}/`;

  const playlistUrl = embed.pathname.toLowerCase().endsWith(".m3u8")
    ? embed.toString()
    : await playlistFromEmbedPage(embed);

  streamHosts.set(new URL(playlistUrl).hostname, referer);

  const playlist = await fetchAsSafari(playlistUrl, referer);
  if (!playlist.startsWith("#EXTM3U")) throw new Error("nguồn không trả về playlist HLS");
  for (const line of playlist.split("\n")) {
    const target = line.trim();
    if (!target || target.startsWith("#")) continue;
    try {
      streamHosts.set(new URL(target, playlistUrl).hostname, referer);
    } catch {
      /* dòng không phải URL hợp lệ thì bỏ qua */
    }
  }

  return playlistUrl;
}

async function playlistFromEmbedPage(embed: URL): Promise<string> {
  const html = await fetchAsSafari(embed.toString(), "https://phim.nguonc.com/");

  const obfuscated = html.match(/data-obf\s*=\s*"([A-Za-z0-9+/=]+)"/)?.[1];
  if (obfuscated) {
    const decoded = JSON.parse(Buffer.from(obfuscated, "base64").toString("utf8"));
    if (typeof decoded?.sUb === "string") {
      return new URL(`/${decoded.sUb}`, embed).toString();
    }
  }

  const direct = html.match(/https?:\/\/[^\s"'\\]+\.m3u8[^\s"'\\]*/)?.[0];
  if (direct) return direct;

  throw new Error("không tìm thấy luồng phát trong trang embed");
}
