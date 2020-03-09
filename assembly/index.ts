// The entry file of your WebAssembly module.

const DELTA_PER_STEP: f32 = 1e-5;
const DELTA_MINIMUM: f32 = 1e-7;
let rollingDelta: f32 = DELTA_PER_STEP;

memory.grow(73);

NativeMathf.seedRandom(1337);

import {
  x_xx,
  x_yy,
  x_tt,
  x_xy,
  x_xt,
  x_yt,
  x_x,
  x_y,
  x_t,
  y_xx,
  y_yy,
  y_tt,
  y_xy,
  y_xt,
  y_yt,
  y_x,
  y_y,
  y_t,
  NUM_STEPS,
  NUM_ITERS
} from "./config";

// const history = new Float32Array(NUM_STEPS * NUM_ITERS * 2);

export function chaos(startTime: f32, xPos: f32, yPos: f32, scaleFactor: f32, speedFactor: f32): f32 {
  const delta: f32 = DELTA_PER_STEP * speedFactor;
  rollingDelta = rollingDelta * 0.99 + delta * 0.01;
  let t: f32 = startTime;

  for (let step: u32 = 0; step < NUM_STEPS; step++) {
    let isOffScreen: boolean = true;

    let x: f32 = t;
    let y: f32 = t;
    for (let iter: u32 = 0; iter < NUM_ITERS; iter++) {
      const xx: f32 = x * x;
      const yy: f32 = y * y;
      const tt: f32 = t * t;
      const xy: f32 = x * y;
      const xt: f32 = x * t;
      const yt: f32 = y * t;

      // const xx: f32 = NativeMathf.min(NativeMathf.max(x * x, f32.MIN_VALUE), f32.MAX_VALUE);
      // const yy: f32 = NativeMathf.min(NativeMathf.max(y * y, f32.MIN_VALUE), f32.MAX_VALUE);
      // const tt: f32 = NativeMathf.min(NativeMathf.max(t * t, f32.MIN_VALUE), f32.MAX_VALUE);
      // const xy: f32 = NativeMathf.min(NativeMathf.max(x * y, f32.MIN_VALUE), f32.MAX_VALUE);
      // const xt: f32 = NativeMathf.min(NativeMathf.max(x * t, f32.MIN_VALUE), f32.MAX_VALUE);
      // const yt: f32 = NativeMathf.min(NativeMathf.max(y * t, f32.MIN_VALUE), f32.MAX_VALUE);
      // const xp: f32 = NativeMathf.min(NativeMathf.max(x, f32.MIN_VALUE), f32.MAX_VALUE);
      // const yp: f32 = NativeMathf.min(NativeMathf.max(y, f32.MIN_VALUE), f32.MAX_VALUE);
      // const tp: f32 = NativeMathf.min(NativeMathf.max(t, f32.MIN_VALUE), f32.MAX_VALUE);
      const nx: f32 =
        xx * x_xx +
        yy * x_yy +
        tt * x_tt +
        xy * x_xy +
        xt * x_xt +
        yt * x_yt +
        x * x_x +
        y * x_y +
        t * x_t;
      const ny: f32 =
        xx * y_xx +
        yy * y_yy +
        tt * y_tt +
        xy * y_xy +
        xt * y_xt +
        yt * y_yt +
        x * y_x +
        y * y_y +
        t * y_t;

      const screenXPos = (nx + xPos) * scaleFactor;
      const screenYPos = (ny + yPos) * scaleFactor;

      const storeIndex: u32 = ((step * NUM_ITERS + iter));

      store<f32>((storeIndex * 3) * 4, screenXPos);
      store<f32>((storeIndex * 3 + 1) * 4, screenYPos);

      x = nx;
      y = ny;

      // const historyIter: u32 = iter * 2;
      //Check if dynamic delta should be adjusted
      // if (screenXPos > -2 && screenYPos > -2 && screenXPos < 2 && screenYPos < 2) {
      //   const dx: f32 = history[historyIter] - x;
      //   const dy: f32 = history[historyIter + 1] - y;
      //   const dist: f32 = 500 * NativeMathf.sqrt(dx * dx + dy * dy);
      //   rollingDelta = NativeMathf.min(rollingDelta, NativeMathf.max(delta / (dist + DELTA_PER_STEP), DELTA_MINIMUM * speedFactor));
      //   isOffScreen = false;
      // }
      // history[historyIter] = x;
      // history[historyIter + 1] = y;
    }

    // if (isOffScreen) {
    //   t += 0.01;
    // } else {
    //   t += rollingDelta;
    // }
    t += rollingDelta;
  }

  return t;
}

export function randomizeMemory(numPts: u32): void {
  for (let i: u32 = 0; i < numPts; i++) {
    store<f32>(4 * (i * 3), NativeMathf.random());
    store<f32>(4 * (i * 3 + 1), NativeMathf.random());
    store<f32>(4 * (i * 3 + 2), 0);
  }
}