import { useEffect, useRef } from "react";

interface Props {
  onReach: () => void;
  disabled?: boolean;
}

/**
 * Mốc vô hình đặt dưới đáy danh sách. Vùng cuộn là thẻ <main>, nên phải lấy
 * chính nó làm root thì rootMargin mới nới ra được để tải trước.
 */
export function InfiniteSentinel({ onReach, disabled = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onReach);
  callback.current = onReach;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      },
      { root: el.closest("main"), rootMargin: "800px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled]);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}
