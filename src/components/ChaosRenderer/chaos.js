// Portions of this file implemented based on https://github.com/HackerPoet/Chaos-Equations
// However it has been written from scratch to utilize JavaScript

import defaultParams from "./defaultParams.js";
import { DELTA_PER_STEP, DELTA_MINIMUM, OFF_SCREEN } from "./constants.js";

const { fround } = Math;

// Each iteration's previous position, used to measure how fast it is moving.
// Single precision, as in the original.
let historyX;
let historyY;

/**
 * Calculates chaos equation iterations
 * Note the tight coupling to the ChaosRenderer context for performance reasons
 *
 * Escaping orbits are deliberately left to overflow: they become Infinity, then
 * NaN, and stay that way for the remaining iterations. Limiting their values
 * would let terms cancel out (1e37 - 1e37 = 0) and bring dead points back.
 */
export default function chaos() {
  const { camera, geometry } = this;
  let { rollingDelta = DELTA_PER_STEP, t } = this;

  const {
    params = defaultParams,
    scaleFactor,
    timeFactor,
    xPos,
    yPos,
    numSteps,
    numIters,
  } = this.props;

  if (!historyX || historyX.length !== numIters) {
    historyX = new Float32Array(numIters);
    historyY = new Float32Array(numIters);
  }

  const positions = geometry.attributes.position.array;
  const skipDirection = Math.sign(timeFactor);

  // Smooth out stepping speed
  const delta = DELTA_PER_STEP;
  rollingDelta = rollingDelta * 0.99 + delta * 0.01;

  // Apply chaos
  for (let step = 0; step < numSteps; step++) {
    let noPointsOnScreen = true;
    let x = t;
    let y = t;

    for (let iter = 0; iter < numIters; iter++) {
      const xx = x * x;
      const yy = y * y;
      const tt = t * t;
      const xy = x * y;
      const xt = x * t;
      const yt = y * t;
      const nx =
        xx * params.x.xx +
        yy * params.x.yy +
        tt * params.x.tt +
        xy * params.x.xy +
        xt * params.x.xt +
        yt * params.x.yt +
        x * params.x.x +
        y * params.x.y +
        t * params.x.t;
      const ny =
        xx * params.y.xx +
        yy * params.y.yy +
        tt * params.y.tt +
        xy * params.y.xy +
        xt * params.y.xt +
        yt * params.y.yt +
        x * params.y.x +
        y * params.y.y +
        t * params.y.t;

      const screenXPos = (nx + xPos) * scaleFactor;
      const screenYPos = (ny + yPos) * scaleFactor;
      const index = (step * numIters + iter) * 3;

      // NaN fails these comparisons, so dead points are treated as off screen
      if (
        screenXPos > camera.left &&
        screenYPos > camera.bottom &&
        screenXPos < camera.right &&
        screenYPos < camera.top
      ) {
        // Slow down if this point moved far since the previous step. Rounds to
        // single precision after each operation to match the original exactly.
        const dx = fround(historyX[iter] - fround(nx));
        const dy = fround(historyY[iter] - fround(ny));
        const dist = fround(
          500 * fround(Math.sqrt(fround(fround(dx * dx) + fround(dy * dy))))
        );
        // A point can be alive now but dead at the previous step, leaving dist
        // NaN. Math.min and Math.max would pass that on and break t for good.
        if (!Number.isNaN(dist)) {
          rollingDelta = Math.min(
            rollingDelta,
            Math.max(delta / (dist + 1e-5), DELTA_MINIMUM)
          );
        }
        noPointsOnScreen = false;
        positions[index] = screenXPos;
        positions[index + 1] = screenYPos;
      } else {
        // Keeps NaN and Infinity away from the GPU
        positions[index] = OFF_SCREEN;
        positions[index + 1] = OFF_SCREEN;
      }

      historyX[iter] = nx;
      historyY[iter] = ny;
      x = nx;
      y = ny;
    }

    // Update t variable. Skipping off-screen stretches isn't scaled by speed,
    // as in the original, but follows its direction so reversing still works.
    if (noPointsOnScreen) {
      t += 0.01 * skipDirection;
    } else {
      t += rollingDelta * timeFactor;
    }
  }

  this.t = t;
  this.rollingDelta = rollingDelta;
}
