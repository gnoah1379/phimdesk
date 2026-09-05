import { useCallback, useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type VjsPlayer from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

interface Props {
  embedUrl: string;
  poster?: string;
  startAt?: number;
  onProgress: (position: number, duration: number) => void;
  onEnded?: () => void;
}

type Mode = "loading" | "native" | "embed";

const VOLUME_KEY = "phimdesk:volume";
const RATE_KEY = "phimdesk:rate";
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_STEP = 10;
const VOLUME_STEP = 0.1;

export function Player({ embedUrl, poster, startAt = 0, onProgress, onEnded }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VjsPlayer | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);
  const startAtRef = useRef(startAt);
  const [mode, setMode] = useState<Mode>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  progressRef.current = onProgress;
  endedRef.current = onEnded;

  // Chỉ tua về vị trí cũ ở lần nạp đầu của mỗi tập, không phải mỗi lần render.
  useEffect(() => {
    startAtRef.current = startAt;
  }, [embedUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const fallback = useCallback((message: string) => {
    setNotice(message);
    setMode("embed");
  }, []);

  // Bong bóng phản hồi nằm bên trong DOM của player để vẫn hiện khi toàn màn hình.
  const showHint = useCallback((text: string) => {
    const el = hintRef.current;
    if (!el) return;
    el.textContent = text;
    el.classList.add("is-visible");
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => el.classList.remove("is-visible"), 900);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMode("loading");
    setNotice(null);

    window.phimdesk
      .resolveStream(embedUrl)
      .then((src) => {
        if (cancelled || !hostRef.current) return;
        setMode("native");

        // video.js thay thế phần tử gốc bằng cây DOM của nó, nên tạo thẻ video
        // thủ công thay vì để React quản lý.
        const video = document.createElement("video");
        video.className = "video-js vjs-big-play-centered vjs-fill";
        video.setAttribute("playsinline", "");
        hostRef.current.replaceChildren(video);

        const player = videojs(video, {
          controls: true,
          autoplay: true,
          preload: "auto",
          poster,
          playbackRates: PLAYBACK_RATES,
          controlBar: {
            skipButtons: { forward: 10, backward: 10 },
            pictureInPictureToggle: true,
            remainingTimeDisplay: { displayNegative: false },
          },
          userActions: { doubleClick: true },
          sources: [{ src, type: "application/x-mpegURL" }],
        });
        playerRef.current = player;

        player.volume(readNumber(VOLUME_KEY, 1, 0));
        player.playbackRate(readNumber(RATE_KEY, 1, 0.25));

        player.ready(() => {
          const hint = document.createElement("div");
          hint.className = "player-hint";
          player.el().appendChild(hint);
          hintRef.current = hint;
        });

        player.on("loadedmetadata", () => {
          const target = startAtRef.current;
          const duration = player.duration() ?? 0;
          if (target > 5 && duration > 0 && target < duration - 15) player.currentTime(target);
          startAtRef.current = 0;
        });

        let lastSaved = 0;
        player.on("timeupdate", () => {
          const now = Date.now();
          if (now - lastSaved < 4000) return;
          lastSaved = now;
          report(player);
        });

        player.on("pause", () => report(player));
        player.on("volumechange", () => writeNumber(VOLUME_KEY, player.volume() ?? 1));
        player.on("ratechange", () => writeNumber(RATE_KEY, player.playbackRate() ?? 1));
        player.on("ended", () => endedRef.current?.());
        player.on("error", () => {
          const detail = player.error()?.message;
          fallback(detail ?? "Không phát được luồng, đã chuyển sang trình phát của nguồn.");
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const detail = err instanceof Error ? err.message : String(err);
        fallback(detail || "Không lấy được luồng phát trực tiếp, dùng trình phát của nguồn.");
      });

    return () => {
      cancelled = true;
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
      hintRef.current = null;
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [embedUrl, attempt, poster, fallback]);

  // Phím tắt bắt ở cấp document: không cần bấm vào player trước mới dùng được,
  // và Space không còn kích hoạt nút đang focus của trang.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const player = playerRef.current;
      if (!player || player.isDisposed()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (!handleShortcut(player, event, showHint)) return;
      event.preventDefault();
      event.stopPropagation();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [showHint]);

  function report(player: VjsPlayer) {
    const position = player.currentTime() ?? 0;
    const duration = player.duration() ?? 0;
    if (duration > 0) progressRef.current(position, duration);
  }

  return (
    <div className="space-y-2">
      <div className="player-stage relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-line">
        {mode === "embed" ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title="Trình phát của nguồn"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <div ref={hostRef} className="h-full w-full" />
        )}

        {mode === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-brand" />
            <p className="text-sm text-zinc-400">Đang tìm luồng phát…</p>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-amber-400/90">
          {notice}
          <button
            className="rounded-md bg-surface-2 px-2 py-1 text-zinc-300 transition hover:bg-surface-3"
            onClick={() => setAttempt((a) => a + 1)}
          >
            Thử phát trực tiếp lại
          </button>
        </p>
      ) : (
        <p className="text-xs text-zinc-600">
          Phím tắt: Space/K phát–dừng · ←/→ tua 10s · ↑/↓ âm lượng · 0–9 nhảy tới % · M tắt tiếng ·
          F toàn màn hình · I thu nhỏ · {"<"}/{">"} tốc độ
        </p>
      )}
    </div>
  );
}

function handleShortcut(
  player: VjsPlayer,
  event: KeyboardEvent,
  showHint: (text: string) => void,
): boolean {
  const duration = player.duration() ?? 0;
  const current = player.currentTime() ?? 0;

  const seekBy = (delta: number) => {
    const next = clamp(current + delta, 0, duration || current + delta);
    player.currentTime(next);
    showHint(`${delta > 0 ? "+" : "−"}${Math.abs(delta)} giây`);
  };

  const changeVolume = (delta: number) => {
    const next = clamp((player.volume() ?? 1) + delta);
    player.volume(next);
    player.muted(next === 0);
    showHint(`Âm lượng ${Math.round(next * 100)}%`);
  };

  const changeRate = (direction: number) => {
    const index = PLAYBACK_RATES.indexOf(player.playbackRate() ?? 1);
    const base = index === -1 ? PLAYBACK_RATES.indexOf(1) : index;
    const next = PLAYBACK_RATES[clamp(base + direction, 0, PLAYBACK_RATES.length - 1)];
    player.playbackRate(next);
    showHint(`Tốc độ ${next}×`);
  };

  switch (event.key) {
    case " ":
    case "k":
    case "K":
      if (player.paused()) {
        void player.play();
        showHint("Đang phát");
      } else {
        player.pause();
        showHint("Tạm dừng");
      }
      return true;

    case "ArrowRight":
    case "l":
    case "L":
      seekBy(SEEK_STEP);
      return true;

    case "ArrowLeft":
    case "j":
    case "J":
      seekBy(-SEEK_STEP);
      return true;

    case "ArrowUp":
      changeVolume(VOLUME_STEP);
      return true;

    case "ArrowDown":
      changeVolume(-VOLUME_STEP);
      return true;

    case "m":
    case "M": {
      const muted = !player.muted();
      player.muted(muted);
      showHint(muted ? "Đã tắt tiếng" : `Âm lượng ${Math.round((player.volume() ?? 1) * 100)}%`);
      return true;
    }

    case "f":
    case "F":
      if (player.isFullscreen()) void player.exitFullscreen();
      else void player.requestFullscreen();
      return true;

    case "i":
    case "I":
      if (document.pictureInPictureElement) void document.exitPictureInPicture();
      else void player.requestPictureInPicture().catch(() => undefined);
      return true;

    case "<":
    case ",":
      changeRate(-1);
      return true;

    case ">":
    case ".":
      changeRate(1);
      return true;

    default:
      break;
  }

  if (/^[0-9]$/.test(event.key) && duration > 0) {
    const percent = Number(event.key) / 10;
    player.currentTime(duration * percent);
    showHint(`${percent * 100}%`);
    return true;
  }

  return false;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function readNumber(key: string, fallbackValue: number, min: number): number {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallbackValue;
  const value = Number(stored);
  return Number.isFinite(value) && value >= min ? value : fallbackValue;
}

function writeNumber(key: string, value: number) {
  localStorage.setItem(key, String(value));
}
