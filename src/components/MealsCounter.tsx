'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated meals-served counter.
 * Counts from 0 -> target over ~1.5s using requestAnimationFrame.
 * Triggers when scrolled into view (IntersectionObserver) so the animation feels intentional.
 */
export function MealsCounter({
  target,
  duration = 1500,
  className = '',
}: {
  target: number;
  duration?: number;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic for a confident settle
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            start();
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${target.toLocaleString()} meals served`}>
      {value.toLocaleString()}
    </span>
  );
}
