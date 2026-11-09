"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const THRESHOLD = 0.35;
const ENGAGE_PX = 10;

type Props = {
  children: ReactNode;
  /** Label revealed under the row while dragging. */
  actionLabel: string;
  /** Called when a swipe past the threshold is released. */
  onSwipe: () => void;
  disabled?: boolean;
};

/**
 * Horizontal swipe on a list row. Only engages when movement is horizontally
 * dominant so vertical scroll still works. Either direction past ~35% width
 * commits; under that, snaps back. Suppresses the next click so a swipe
 * doesn't open the detail sheet.
 */
export function SwipeableRow({ children, actionLabel, onSwipe, disabled }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const width = useRef(0);
  const offsetRef = useRef(0);
  const dragging = useRef(false);
  const engaged = useRef(false);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  const [widthPx, setWidthPx] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const setOff = useCallback((v: number) => {
    offsetRef.current = v;
    setOffset(v);
  }, []);

  const reset = useCallback(
    (animate: boolean) => {
      setAnimating(animate && !reduced);
      setOff(0);
      engaged.current = false;
      dragging.current = false;
    },
    [reduced, setOff],
  );

  const commit = useCallback(() => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(12);
      } catch {
        /* ignore */
      }
    }
    setAnimating(!reduced);
    setExiting(true);
    setOff(0);
    const delay = reduced ? 0 : 180;
    window.setTimeout(() => onSwipe(), delay);
  }, [onSwipe, reduced, setOff]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || exiting || e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("button, a, textarea, input, label")) return;
    dragging.current = true;
    engaged.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    width.current = trackRef.current?.offsetWidth ?? 1;
    setWidthPx(width.current);
    setAnimating(false);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!engaged.current) {
      if (Math.abs(dx) < ENGAGE_PX && Math.abs(dy) < ENGAGE_PX) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        dragging.current = false;
        reset(false);
        return;
      }
      engaged.current = true;
      suppressClick.current = true;
      // Capture only once the gesture is a horizontal drag, so plain taps keep their own target.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    e.preventDefault();
    const max = width.current;
    setOff(Math.max(-max, Math.min(max, dx)));
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!engaged.current) {
      reset(false);
      return;
    }
    const ratio = Math.abs(offsetRef.current) / (width.current || 1);
    if (ratio >= THRESHOLD) {
      commit();
    } else {
      reset(true);
    }
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current || exiting) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  const reveal = Math.min(1, Math.abs(offset) / (widthPx * THRESHOLD));

  return (
    <div
      className={`swipe${exiting ? " swipe-exit" : ""}${reduced ? " swipe-reduced" : ""}`}
      onClickCapture={onClickCapture}
    >
      <div className="swipe-bg" aria-hidden style={{ opacity: exiting ? 1 : reveal }}>
        <span className="swipe-check" aria-hidden>
          ✓
        </span>
        <span>{actionLabel}</span>
      </div>
      <div
        ref={trackRef}
        className={`swipe-track${animating ? " swipe-anim" : ""}`}
        style={{ transform: exiting ? undefined : `translate3d(${offset}px,0,0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}
