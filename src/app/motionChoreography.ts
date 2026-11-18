/**
 * Pure Motion Choreography & Physics System for Kian (Flow)
 *
 * Centralizes spring physics presets, bounded stagger timing, RTL-aware
 * directional slide vectors, cursor spotlight math, and reading progress
 * calculations. Decoupled from DOM/React so every invariant is unit-tested.
 */

export const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 520,
  damping: 36,
  mass: 0.85,
};

export const SPRING_SILK = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.9,
};

export const SPRING_TACTILE = {
  type: "spring" as const,
  stiffness: 620,
  damping: 26,
  mass: 0.65,
};

export const EASE_EDITORIAL: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1];

export const DESKTOP_WORKSPACE_ORDER = [
  "reader",
  "editorial",
  "visual_flow",
  "graph",
] as const;

export const MOBILE_TAB_ORDER = [
  "home",
  "international",
  "discover",
  "saved",
  "me",
] as const;

/**
 * Computes a bounded stagger delay in seconds so list/grid entrances feel
 * choreographed on the visible fold while guaranteeing zero-latency access
 * for items deeper in the list (capped at maxDelayMs).
 */
export function computeStaggerDelay(
  index: number,
  stepMs = 18,
  maxDelayMs = 180,
): number {
  if (!Number.isFinite(index) || index <= 0 || stepMs <= 0 || maxDelayMs <= 0) {
    return 0;
  }
  const clampedMs = Math.min(index * stepMs, maxDelayMs);
  return Math.round(clampedMs) / 1000;
}

/**
 * Computes RTL-aware horizontal slide direction (-1, 0, or +1) and pixel offset
 * when transitioning from `prevKey` to `nextKey` along an ordered navigation bar.
 *
 * In an RTL tab bar:
 * - Index 0 sits on the right, higher indices sit further to the left.
 * - Moving from index 0 -> index 1 moves visually leftward, so incoming content
 *   enters from the left (-distancePx) while outgoing exits right (+distancePx).
 */
export function computeDirectionalSlide<T extends string>(
  prevKey: T | null | undefined,
  nextKey: T,
  order: readonly T[],
  options: { isRtl?: boolean; distancePx?: number } = {},
): { direction: -1 | 0 | 1; enterX: number; exitX: number } {
  const { isRtl = true, distancePx = 22 } = options;
  if (!prevKey || prevKey === nextKey) {
    return { direction: 0, enterX: 0, exitX: 0 };
  }
  const prevIdx = order.indexOf(prevKey);
  const nextIdx = order.indexOf(nextKey);
  if (prevIdx === -1 || nextIdx === -1 || prevIdx === nextIdx) {
    return { direction: 0, enterX: 0, exitX: 0 };
  }

  const rawStep: -1 | 1 = nextIdx > prevIdx ? 1 : -1;
  // In LTR, advancing (nextIdx > prevIdx) enters from +X (right).
  // In RTL, advancing (nextIdx > prevIdx) moves visually left, so it enters from -X (left).
  const sign: -1 | 1 = isRtl ? (rawStep === 1 ? -1 : 1) : rawStep;
  const d = Math.abs(distancePx);

  return {
    direction: rawStep,
    enterX: sign * d,
    exitX: -sign * d,
  };
}

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Computes normalized & clamped spotlight coordinates (in px and %) inside an interactive card.
 */
export function computeSpotlightCoords(
  clientX: number,
  clientY: number,
  rect: RectLike,
): { x: number; y: number; pctX: number; pctY: number } {
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const x = Math.max(0, Math.min(width, clientX - rect.left));
  const y = Math.max(0, Math.min(height, clientY - rect.top));
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    pctX: Math.round((x / width) * 1000) / 10,
    pctY: Math.round((y / height) * 1000) / 10,
  };
}

/**
 * Computes subtle magnetic pull translation (clamped to maxPullPx) for primary tactile controls.
 */
export function computeMagneticPull(
  clientX: number,
  clientY: number,
  rect: RectLike,
  strength = 0.16,
  maxPullPx = 5,
): { dx: number; dy: number } {
  if (rect.width <= 0 || rect.height <= 0) return { dx: 0, dy: 0 };
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const rawDx = (clientX - centerX) * strength;
  const rawDy = (clientY - centerY) * strength;
  const clamp = (v: number) => Math.max(-maxPullPx, Math.min(maxPullPx, v));
  return {
    dx: Math.round(clamp(rawDx) * 100) / 100,
    dy: Math.round(clamp(rawDy) * 100) / 100,
  };
}

/**
 * Computes normalized reading progress [0..1] for compositor scaleX progress bars.
 */
export function computeReadingScale(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const maxScroll = scrollHeight - clientHeight;
  if (!Number.isFinite(maxScroll) || maxScroll <= 0) return 0;
  const ratio = scrollTop / maxScroll;
  return Math.max(0, Math.min(1, Math.round(ratio * 10000) / 10000));
}
