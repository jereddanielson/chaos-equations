// Value written to a culled point's x coordinate to move it off screen
const OFFSCREEN = 1e30;
const EMPTY = -1;
// Distance in pixels from a coverage boundary within which the GPU's
// rounding may put a point on either side of it
const EDGE_MARGIN = 1 / 64;
const EDGE_LAYERS_FACTOR = 4;

// Open-addressed hash table of points kept so far this frame, keyed by the
// block of pixels a point covers. Entries are [key, count] pairs. Sized by
// point count, not canvas size.
let table = new Int32Array(0);
let hashShift = 0;

/**
 * Number of stacked points after which anything underneath is hidden.
 * Each point drawn on top of a pixel scales what's below by (1 - opacity), so
 * past this many layers the earlier ones contribute less than 0.2% of the
 * final color.
 * @param {number} opacity Point opacity, range 0.0 - 1.0
 * @returns {number}
 */
export function getMaxLayers(opacity) {
  if (!(opacity > 0)) return 65535;
  if (opacity >= 1) return 1;
  return Math.min(65535, Math.ceil(Math.log(0.002) / Math.log(1 - opacity)));
}

/**
 * Moves points off screen when they are buried under enough later points
 * that they can't affect the image.
 *
 * Attractors routinely collapse hundreds of thousands of points onto a
 * handful of pixels. Blending is order dependent, so the GPU has to process
 * every one of those stacked points serially, which costs far more than
 * drawing the same number of points spread across the screen.
 *
 * Points are drawn in index order as squares, so two points cover exactly
 * the same pixels when their squares start at the same pixel and span the
 * same number of pixels. Walking backwards and keeping only the last
 * `maxLayers` points per distinct square gives the same picture for a
 * fraction of the work. This relies on the canvas not being multisampled:
 * with MSAA, coverage also depends on where a point sits within a pixel.
 *
 * A point whose edge lands almost exactly on a pixel center could be rounded
 * either way by the GPU, so those are grouped separately and given a larger
 * allowance.
 *
 * @param {Float32Array} positions xyz triples, modified in place
 * @param {object} view
 * @param {number} view.left World-space bounds of the visible area
 * @param {number} view.right
 * @param {number} view.bottom
 * @param {number} view.top
 * @param {number} view.scaleX Scale applied to positions before projection
 * @param {number} view.scaleY
 * @param {number} view.width Drawing buffer size in pixels
 * @param {number} view.height
 * @param {number} view.pointSize Point size in drawing buffer pixels
 * @param {number} maxLayers Points to keep per square, see getMaxLayers
 * @param {number} [sampleStride] When greater than 1, look at only every
 *   nth point and leave positions untouched. Much cheaper, and the return
 *   value estimates what a full pass would cull.
 * @returns {number} Number of points culled
 */
export function cullOverdraw(positions, view, maxLayers, sampleStride = 1) {
  const { left, bottom, scaleX, scaleY, width, height, pointSize } = view;
  const numPoints = Math.ceil(positions.length / 3 / sampleStride);
  if (width === 0 || height === 0 || numPoints === 0) return 0;
  const dryRun = sampleStride > 1;
  // A stack of n points shows up as about n / sampleStride in the sample
  maxLayers = Math.max(1, Math.round(maxLayers / sampleStride));

  // Keep the table under half full so probe sequences stay short
  let bits = 4;
  while (1 << bits < numPoints * 2) bits++;
  if (table.length !== 2 << bits) {
    table = new Int32Array(2 << bits);
    hashShift = 32 - bits;
  }
  table.fill(EMPTY);
  const mask = table.length - 1;
  const indexStep = sampleStride * 3;
  const edgeMaxLayers = maxLayers * EDGE_LAYERS_FACTOR;

  const toPixelX = (width / (view.right - left)) * scaleX;
  const toPixelY = (height / (view.top - bottom)) * scaleY;
  const half = pointSize / 2;
  // Leave room for squares that start left of or above the canvas
  const pad = Math.ceil(half) + 2;
  const stride = width + pad * 2;
  if ((height + pad * 2) * stride * 16 > 0x7fffffff) return 0;

  // A pixel is covered when its center falls inside the point's square, so
  // work in coordinates where the square's first edge crossing an integer
  // means it has moved on to the next pixel. Offset by pad to stay positive.
  const offsetX = (-left * toPixelX) / scaleX - half - 0.5 + pad;
  const offsetY = (-bottom * toPixelY) / scaleY - half - 0.5 + pad;
  const sizeFraction = pointSize - Math.floor(pointSize);
  // Points whose square is entirely outside the canvas are left alone
  const minStart = pad - pointSize - 0.5;
  const maxStartX = width + pad - 0.5;
  const maxStartY = height + pad - 0.5;
  const edgeLow = EDGE_MARGIN;
  const edgeHigh = 1 - EDGE_MARGIN;

  let culled = 0;

  for (let i = positions.length - 3; i >= 0; i -= indexStep) {
    const startX = positions[i] * toPixelX + offsetX;
    const startY = positions[i + 1] * toPixelY + offsetY;
    // Written so NaN fails the test
    if (
      !(
        startX > minStart &&
        startX < maxStartX &&
        startY > minStart &&
        startY < maxStartY
      )
    ) {
      continue;
    }

    // Where the square's first and last edges sit within a pixel. Squares
    // that agree on the first pixel and on whether the last edge reaches one
    // pixel further cover the same pixels.
    const floorX = startX | 0;
    const floorY = startY | 0;
    const fracX = startX - floorX;
    const fracY = startY - floorY;
    let endFracX = fracX + sizeFraction;
    let endFracY = fracY + sizeFraction;
    let key = (floorY * stride + floorX) * 16;
    if (endFracX > 1) {
      endFracX -= 1;
      key += 8;
    }
    if (endFracY > 1) {
      endFracY -= 1;
      key += 4;
    }
    let limit = maxLayers;
    if (
      fracX < edgeLow ||
      fracX > edgeHigh ||
      endFracX < edgeLow ||
      endFracX > edgeHigh
    ) {
      key += 2;
      limit = edgeMaxLayers;
    }
    if (
      fracY < edgeLow ||
      fracY > edgeHigh ||
      endFracY < edgeLow ||
      endFracY > edgeHigh
    ) {
      key += 1;
      limit = edgeMaxLayers;
    }

    let slot = (Math.imul(key, 0x9e3779b1) >>> hashShift) << 1;
    while (table[slot] !== key && table[slot] !== EMPTY) {
      slot = (slot + 2) & mask;
    }
    if (table[slot] === EMPTY) {
      table[slot] = key;
      table[slot + 1] = 1;
    } else if (table[slot + 1] >= limit) {
      if (!dryRun) positions[i] = OFFSCREEN;
      culled++;
    } else {
      table[slot + 1]++;
    }
  }

  return culled * sampleStride;
}
