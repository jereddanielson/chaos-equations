export const FLT_MAX = 1e+37;
export const DELTA_PER_STEP = 1e-5;
export const DELTA_MINIMUM = 1e-7;
export const T_MIN = -3;
export const T_MAX = 3;
export const SIM_TICK_MS = 1000 / 60;
export const SIM_FRAME_BUDGET_MS = 16;
export const SIM_MAX_TICKS_PER_FRAME = 2; // enough to hold full speed down to 30fps
// Culling costs a few ms per tick, so it only stays on while it removes at
// least this share of the points
export const OVERDRAW_MIN_CULL_RATIO = 0.2;
export const OVERDRAW_RECHECK_TICKS = 6;
// Odd on purpose: points that land on the same pixel are often a whole number
// of orbits apart, and a stride that divides numIters would see all or none
export const OVERDRAW_SAMPLE_STRIDE = 7;
export const RENDER_SCALE = 2; // canvas pixels per device pixel
export const paramsDimensions = ["x", "y"];
export const paramsOrder = ["xx", "yy", "tt", "xy", "xt", "yt", "x", "y", "t"];
