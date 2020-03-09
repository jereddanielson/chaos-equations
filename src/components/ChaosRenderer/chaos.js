// Portions of this file implemented based on https://github.com/HackerPoet/Chaos-Equations
// However it has been written from scratch to utilize JavaScript

import defaultParams from "./defaultParams.js";
import { FLT_MAX, DELTA_PER_STEP, DELTA_MINIMUM } from "./constants.js";

let history;

const loader = require("@assemblyscript/loader");

/**
 * Calculates chaos equation iterations
 * Note the tight coupling to the ChaosRenderer context for performance reasons
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
    numIters
  } = this.props;

  history =
    history ||
    Array(numIters)
      .fill("")
      .map(() => {
        return { x: 0, y: 0 };
      });

  // Smooth out stepping speed
  const delta = DELTA_PER_STEP;
  rollingDelta = rollingDelta * 0.99 + delta * 0.01;

  // Apply chaos
  for (let step = 0; step < numSteps; step++) {
    let noPointsOnScreen = true;
    let x = t;
    let y = t;

    for (let iter = 0; iter < numIters; iter++) {
      const xx = Math.min(Math.max(x * x, -FLT_MAX), FLT_MAX);
      const yy = Math.min(Math.max(y * y, -FLT_MAX), FLT_MAX);
      const tt = Math.min(Math.max(t * t, -FLT_MAX), FLT_MAX);
      const xy = Math.min(Math.max(x * y, -FLT_MAX), FLT_MAX);
      const xt = Math.min(Math.max(x * t, -FLT_MAX), FLT_MAX);
      const yt = Math.min(Math.max(y * t, -FLT_MAX), FLT_MAX);
      const xp = Math.min(Math.max(x, -FLT_MAX), FLT_MAX);
      const yp = Math.min(Math.max(y, -FLT_MAX), FLT_MAX);
      const tp = Math.min(Math.max(t, -FLT_MAX), FLT_MAX);
      const nx =
        xx * params.x.xx +
        yy * params.x.yy +
        tt * params.x.tt +
        xy * params.x.xy +
        xt * params.x.xt +
        yt * params.x.yt +
        xp * params.x.x +
        yp * params.x.y +
        tp * params.x.t;
      const ny =
        xx * params.y.xx +
        yy * params.y.yy +
        tt * params.y.tt +
        xy * params.y.xy +
        xt * params.y.xt +
        yt * params.y.yt +
        xp * params.y.x +
        yp * params.y.y +
        tp * params.y.t;

      const screenXPos = (nx + xPos) * scaleFactor;
      const screenYPos = (ny + yPos) * scaleFactor;

      // Check if dynamic delta should be adjusted
      if (
        // only do this 1% of the time?
        iter % 100 === 0 &&
        screenXPos > camera.left &&
        screenYPos > camera.bottom &&
        screenXPos < camera.right &&
        screenYPos < camera.top
      ) {
        const dx = history[iter] ? history[iter].x - nx : nx;
        const dy = history[iter] ? history[iter].y - ny : ny;
        const dist = 500 * Math.sqrt(dx * dx + dy * dy);
        rollingDelta = Math.min(
          rollingDelta,
          Math.max(delta / (dist + 1e-5), DELTA_MINIMUM)
        );
        noPointsOnScreen = false;
      }

      history[iter] = { x: nx, y: ny };

      // Update geometry
      geometry.attributes.position.array[
        (step * numIters + iter) * 3
      ] = screenXPos;
      geometry.attributes.position.array[
        (step * numIters + iter) * 3 + 1
      ] = screenYPos;
      x = nx;
      y = ny;
    }

    // Update t variable
    if (noPointsOnScreen) {
      t += 0.01 * timeFactor;
    } else {
      t += rollingDelta * timeFactor;
    }
  }

  this.t = t;
  this.rollingDelta = rollingDelta;
}

const defaultChaosParams = {
  x_xx: 0,
  x_yy: 0,
  x_tt: 0,
  x_xy: 0,
  x_xt: 0,
  x_yt: 0,
  x_x: 0,
  x_y: 0,
  x_t: 0,
  y_xx: 0,
  y_yy: 0,
  y_tt: 0,
  y_xy: 0,
  y_xt: 0,
  y_yt: 0,
  y_x: 0,
  y_y: 0,
  y_t: 0,
  NUM_STEPS: 500,
  NUM_ITERS: 800
};

export function loadChaos(config) {
  const wasmMemory = new WebAssembly.Memory({ initial: 1, maximum: 200 });
  return loader
    .instantiateStreaming(fetch("optimized.wasm"), {
      env: {
        memory: wasmMemory
      },
      config: { ...defaultChaosParams, ...config }
    })
    .then(wasmInstance => {
      window.wasmInstance = wasmInstance;
      const { chaos } = wasmInstance;
      const memory = new Float32Array(wasmInstance.memory.buffer);

      return [
        memory,
        (t, xPos, yPos, scaleFactor, timeFactor) => {
          return chaos(t, xPos, yPos, scaleFactor, timeFactor);
        }
      ];
    });
}
