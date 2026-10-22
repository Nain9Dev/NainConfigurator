/**
 * Numeric easing for the scene.
 *
 * Every number the renderer draws comes from the pack's resolved variables and
 * slot colours, so a change of selection is a change of numbers, not a change
 * of paths. Easing those numbers makes a board visibly grow and a finish
 * visibly darken without a single path morph.
 *
 * `prefers-reduced-motion: reduce` collapses the whole thing to an assignment.
 */

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 340;

export function useEasedRecord(
  target: Readonly<Record<string, number>>,
): Record<string, number> {
  const [current, setCurrent] = useState<Record<string, number>>(() => ({
    ...target,
  }));
  const currentRef = useRef(current);
  const frameRef = useRef(0);

  currentRef.current = current;

  // A stable identity for a record of primitives: the hook should restart only
  // when a value actually moves.
  const signature = stringify(target);

  useEffect(() => {
    const from = currentRef.current;
    const to = target;

    if (!sameKeys(from, to) || prefersReducedMotion()) {
      setCurrent({ ...to });
      return;
    }

    const started = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / DURATION_MS);
      const eased = easeOutCubic(progress);
      const next: Record<string, number> = {};

      for (const [key, value] of Object.entries(to)) {
        const start = from[key] ?? value;
        next[key] = start + (value - start) * eased;
      }

      setCurrent(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameRef.current);
    // `signature` stands in for `target`, which is a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return current;
}

function sameKeys(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): boolean {
  const leftKeys = Object.keys(left);

  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every((key) => key in right)
  );
}

function stringify(record: Readonly<Record<string, number>>): string {
  return Object.keys(record)
    .sort()
    .map((key) => `${key}:${record[key]}`)
    .join("|");
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
