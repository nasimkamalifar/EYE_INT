import test from "node:test";
import assert from "node:assert/strict";
import {
  DESKTOP_WORKSPACE_ORDER,
  MOBILE_TAB_ORDER,
  computeStaggerDelay,
  computeDirectionalSlide,
  computeSpotlightCoords,
  computeMagneticPull,
  computeReadingScale,
} from "./motionChoreography";

test("computeStaggerDelay scales linearly and caps strictly at maxDelayMs", () => {
  assert.equal(computeStaggerDelay(0, 20, 180), 0);
  assert.equal(computeStaggerDelay(-3, 20, 180), 0);
  assert.equal(computeStaggerDelay(1, 20, 180), 0.02);
  assert.equal(computeStaggerDelay(4, 20, 180), 0.08);
  assert.equal(computeStaggerDelay(50, 20, 180), 0.18);
});

test("computeDirectionalSlide calculates RTL-coherent enter/exit vectors", () => {
  // Moving from reader (0, rightmost) to editorial (1, further left) in RTL
  const forwardRtl = computeDirectionalSlide("reader", "editorial", DESKTOP_WORKSPACE_ORDER, {
    isRtl: true,
    distancePx: 24,
  });
  assert.equal(forwardRtl.direction, 1);
  assert.equal(forwardRtl.enterX, -24);
  assert.equal(forwardRtl.exitX, 24);

  // Moving back from graph (3) to reader (0) in RTL
  const backwardRtl = computeDirectionalSlide("graph", "reader", DESKTOP_WORKSPACE_ORDER, {
    isRtl: true,
    distancePx: 24,
  });
  assert.equal(backwardRtl.direction, -1);
  assert.equal(backwardRtl.enterX, 24);
  assert.equal(backwardRtl.exitX, -24);

  // Same tab produces zero movement
  const same = computeDirectionalSlide("home", "home", MOBILE_TAB_ORDER);
  assert.equal(same.direction, 0);
  assert.equal(same.enterX, 0);
  assert.equal(same.exitX, 0);
});

test("computeSpotlightCoords normalizes and clamps cursor coordinates inside rect", () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  const inside = computeSpotlightCoords(150, 100, rect);
  assert.equal(inside.x, 50);
  assert.equal(inside.y, 50);
  assert.equal(inside.pctX, 25);
  assert.equal(inside.pctY, 50);

  const outside = computeSpotlightCoords(500, -20, rect);
  assert.equal(outside.x, 200);
  assert.equal(outside.y, 0);
  assert.equal(outside.pctX, 100);
  assert.equal(outside.pctY, 0);
});

test("computeMagneticPull pulls gently toward cursor and clamps to maxPullPx", () => {
  const rect = { left: 0, top: 0, width: 100, height: 40 };
  const centered = computeMagneticPull(50, 20, rect, 0.2, 5);
  assert.equal(centered.dx, 0);
  assert.equal(centered.dy, 0);

  const extreme = computeMagneticPull(200, -100, rect, 0.2, 5);
  assert.equal(extreme.dx, 5);
  assert.equal(extreme.dy, -5);
});

test("computeReadingScale returns clamped [0..1] scale factor for compositor bars", () => {
  assert.equal(computeReadingScale(0, 1000, 500), 0);
  assert.equal(computeReadingScale(250, 1000, 500), 0.5);
  assert.equal(computeReadingScale(600, 1000, 500), 1);
  assert.equal(computeReadingScale(100, 400, 400), 0);
});
