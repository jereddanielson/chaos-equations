const THREE = require("three");

const FLT_MAX = 1e37;
const NUM_PARAMS = 18;
let STEPS_PER_FRAME = 500;
let ITERS = 800;
const DELTA_PER_STEP = 1e-5;
const DELTA_MINIMUM = 1e-7;
const T_START = -3.0;
const T_END = 3.0;
const FADE_SPEEDS = [10, 2, 0, 255];
const DOT_SIZES = [1, 3, 10];
const ITERATION_LIMIT = false;
const ONE_FRAME = 1000 / 60;
let lastTime = Date.now();

let minX,
  maxX,
  minY,
  maxY = 0;

let plotScale = 1;
let plotX = 0.0;
let plotY = 0.0;
let params = {
  x: {
    xx: 0,
    yy: 0,
    tt: 0,
    xy: 0,
    xt: 0,
    yt: 0,
    x: 0,
    y: 0,
    t: 0
  },
  y: {
    xx: 0,
    yy: 0,
    tt: 0,
    xy: 0,
    xt: 0,
    yt: 0,
    x: 0,
    y: 0,
    t: 0
  }
};
let history = Array(ITERS)
  .fill("")
  .map(() => {
    return { x: 0, y: 0 };
  });

// Set params

const defaultParams = [
  // DPPREG
  {
    x: {
      xx: -1,
      xt: 1,
      y: 1
    },
    y: {
      xx: 1,
      yy: -1,
      tt: -1,
      xy: -1,
      yt: 1,
      x: -1,
      y: 1
    }
  },
  // RMCQDI
  {
    x: {
      xx: 1,
      yy: -1,
      tt: -1,
      x: -1,
      t: -1
    },
    y: {
      yy: 1,
      tt: 1,
      xy: -1,
      y: -1,
      t: -1
    }
  }
];

const paramsDimensions = ["x", "y"];
const paramsOrder = ["xx", "yy", "tt", "xy", "xt", "yt", "x", "y", "t"];

function paramsToString(params) {
  const paramsSafe = {};
  for (let i = 0; i < paramsDimensions.length; i++) {
    paramsSafe[paramsDimensions[i]] = params[paramsDimensions[i]] || {};
  }
  const base27 = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let a = 0;
  let n = 0;
  let result = "";
  for (let d = 0; d < paramsDimensions.length; d++) {
    for (let i = 0; i < paramsOrder.length; ++i) {
      a =
        a * 3 +
        parseInt(paramsSafe[paramsDimensions[d]][paramsOrder[i]] || 0) +
        1;
      n += 1;
      if (n == 3) {
        result += base27[a];
        a = 0;
        n = 0;
      }
    }
  }
  return result;
}

function stringToParams(str) {
  const params = [];
  for (let i = 0; i < Math.floor(18 / 3); ++i) {
    let a = 0;
    const c = i < str.length ? str[i] : "_";
    if (c >= "A" && c <= "Z") {
      a = Math.floor(c.charCodeAt(0) - 65) + 1;
    } else if (c >= "a" && c <= "z") {
      a = Math.floor(c.charCodeAt(0) - 97) + 1;
    }
    params[i * 3 + 2] = (a % 3) - 1.0;
    a = Math.floor(a / 3);
    params[i * 3 + 1] = (a % 3) - 1.0;
    a = Math.floor(a / 3);
    params[i * 3 + 0] = (a % 3) - 1.0;
  }
  const ret = {};
  for (let d = 0; d < paramsDimensions.length; d++) {
    ret[paramsDimensions[d]] = {};
    for (let i = 0; i < paramsOrder.length; ++i) {
      ret[paramsDimensions[d]][paramsOrder[i]] =
        params[d * paramsOrder.length + i];
    }
  }
  return ret;
}

function setRandomParams() {
  const ret = {};
  for (let d = 0; d < paramsDimensions.length; d++) {
    ret[paramsDimensions[d]] = {};
    for (let i = 0; i < paramsOrder.length; ++i) {
      ret[paramsDimensions[d]][paramsOrder[i]] =
        Math.floor(Math.random() * 3) - 1;
    }
  }
  return ret;
}

// UI
// const ui_time = document.querySelector("#timeValue");
// const ui_speed = document.querySelector("#speedValue");
// const ui_steps = document.querySelector("#stepsValue");
// const ui_iters = document.querySelector("#itersValue");
// const ui_plotScale = document.querySelector("#plotScaleValue");
// const ui_playPause = document.querySelector("#play-pause");
// const debug = document.querySelector("#debug");

// const ui_time_plus1_0 = document.querySelector("#time_plus1_0");
// const ui_time_plus0_1 = document.querySelector("#time_plus0_1");
// const ui_time_plus0_01 = document.querySelector("#time_plus0_01");
// const ui_time_minus0_01 = document.querySelector("#time_minus0_01");
// const ui_time_minus0_1 = document.querySelector("#time_minus0_1");
// const ui_time_minus1_0 = document.querySelector("#time_minus1_0");

// const ui_speed_plus0_1 = document.querySelector("#speed_plus0_1");
// const ui_speed_plus0_01 = document.querySelector("#speed_plus0_01");
// const ui_speed_plus0_001 = document.querySelector("#speed_plus0_001");
// const ui_speed_plus0_0001 = document.querySelector("#speed_plus0_0001");
// const ui_speed_minus0_0001 = document.querySelector("#speed_minus0_0001");
// const ui_speed_minus0_001 = document.querySelector("#speed_minus0_001");
// const ui_speed_minus0_01 = document.querySelector("#speed_minus0_01");
// const ui_speed_minus0_1 = document.querySelector("#speed_minus0_1");

// const ui_steps_plus1 = document.querySelector("#steps_plus1");
// const ui_steps_minus1 = document.querySelector("#steps_minus1");

// const ui_iters_plus1 = document.querySelector("#iters_plus1");
// const ui_iters_minus1 = document.querySelector("#iters_minus1");

// const ui_plotScale_plus1_0 = document.querySelector("#plotScale_plus1_0");
// const ui_plotScale_plus0_1 = document.querySelector("#plotScale_plus0_1");
// const ui_plotScale_plus0_01 = document.querySelector("#plotScale_plus0_01");
// const ui_plotScale_minus0_01 = document.querySelector("#plotScale_minus0_01");
// const ui_plotScale_minus0_1 = document.querySelector("#plotScale_minus0_1");
// const ui_plotScale_minus1_0 = document.querySelector("#plotScale_minus1_0");

// const ui_time_modifiers = [
//   ui_time_plus1_0,
//   ui_time_plus0_1,
//   ui_time_plus0_01,
//   ui_time_minus0_01,
//   ui_time_minus0_1,
//   ui_time_minus1_0
// ];

// const ui_speed_modifiers = [
//   ui_speed_plus0_1,
//   ui_speed_plus0_01,
//   ui_speed_plus0_001,
//   ui_speed_plus0_0001,
//   ui_speed_minus0_0001,
//   ui_speed_minus0_001,
//   ui_speed_minus0_01,
//   ui_speed_minus0_1
// ];

// const ui_steps_modifiers = [ui_steps_plus1, ui_steps_minus1];

// const ui_iters_modifiers = [ui_iters_plus1, ui_iters_minus1];

// const ui_plotScale_modifiers = [
//   ui_plotScale_plus1_0,
//   ui_plotScale_plus0_1,
//   ui_plotScale_plus0_01,
//   ui_plotScale_minus0_01,
//   ui_plotScale_minus0_1,
//   ui_plotScale_minus1_0
// ];

// function getRandomColor(i) {
//   const r = Math.min(255, 50 + (i * 11909) % 256);
//   const g = Math.min(255, 50 + (i * 52973) % 256);
//   const b = Math.min(255, 50 + (i * 44111) % 256);
//   return {r, g, b};
// }

function toScreen(x, y) {
  const s = plotScale * maxX;
  // const nx = window.innerWidth * 0.5 + (x - plotX) * s;
  // const ny = window.innerHeight * 0.5 + (y - plotY) * s;
  const nx = (x - plotX) * s;
  const ny = (y - plotY) * s;
  return { x: nx, y: ny };
}

let t = T_START;
let rollingDelta = DELTA_PER_STEP;
let speedMult = 1.0;
let playing = true;
let trailType = 3;
let dotType = 1;
let iterationLimit = false;

// ui_playPause.addEventListener("click", () => {
//   if (playing) {
//     document.querySelector("#play-icon").style.display = "";
//     document.querySelector("#pause-icon").style.display = "none";
//     playing = false;
//   } else {
//     document.querySelector("#play-icon").style.display = "none";
//     document.querySelector("#pause-icon").style.display = "";
//     playing = true;
//   }
// });

// ui_time_modifiers.forEach(ea => {
//   ea.addEventListener("click", () => {
//     t = t + parseFloat(ea.dataset.amount);
//   });
// });

// ui_speed_modifiers.forEach(ea => {
//   ea.addEventListener("click", () => {
//     speedMult = currentKeysDown["Meta"]
//       ? parseFloat(ea.dataset.amount)
//       : speedMult + parseFloat(ea.dataset.amount);
//     ui_speed.innerText = speedMult.toFixed(4);
//   });
//   ui_speed.innerText = speedMult.toFixed(4);
// });

// ui_steps_modifiers.forEach(ea => {
//   ea.addEventListener("click", () => {
//     STEPS_PER_FRAME = STEPS_PER_FRAME + parseFloat(ea.dataset.amount);
//     ui_steps.innerText = STEPS_PER_FRAME;
//   });
//   ui_steps.innerText = STEPS_PER_FRAME;
// });

// ui_iters_modifiers.forEach(ea => {
//   ea.addEventListener("click", () => {
//     ITERS = ITERS + parseFloat(ea.dataset.amount);
//     ui_iters.innerText = ITERS;
//   });
//   ui_iters.innerText = ITERS;
// });

// ui_plotScale_modifiers.forEach(ea => {
//   ea.addEventListener("click", () => {
//     plotScale = plotScale + parseFloat(ea.dataset.amount);
//     if (plotScale === 0) {
//       plotScale = 0.01;
//     }
//     points.scale.set(plotScale, -plotScale, plotScale);
//     ui_plotScale.innerText = plotScale.toFixed(2);
//   });
//   ui_plotScale.innerText = plotScale.toFixed(2);
// });

// []
//   .concat(
//     ui_time_modifiers,
//     ui_speed_modifiers,
//     ui_steps_modifiers,
//     ui_iters_modifiers,
//     ui_plotScale_modifiers
//   )
//   .forEach(ea => {
//     ea.addEventListener("click", () => {
//       renderer.clear();
//       renderer.render(scene, camera);
//     });
//   });

// function randColor(i) {
//   const r = Math.min(255, 50 + (i * 11909) % 256);
//   const g = Math.min(255, 50 + (i * 52973) % 256);
//   const b = Math.min(255, 50 + (i * 44111) % 256);
//   return {r, g, b};
// }

function randColor(i) {
  const color = new THREE.Color("hsl(" + (i % 360) + ", 100%, 50%)");
  return { r: color.r * 255, g: color.g * 255, b: color.b * 255 };
}

var container;

var aspectRatio = 1;

var camera, scene, renderer;

var points, geometry, particles;

const randomColorWheelAdd = Math.floor(Math.random() * ITERS);

function init() {
  container = document.querySelector("#container");

  //

  // camera = new THREE.PerspectiveCamera(
  //   90,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   20
  // );
  // camera.position.z = 10;
  aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.OrthographicCamera(
    -1 * aspectRatio,
    1 * aspectRatio,
    1,
    -1,
    0.1,
    20
  );
  camera.position.set(0, 0, 1);

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x111213);
  // scene.fog = new THREE.Fog(0x050505, 2000, 3500);

  //

  particles = ITERS * STEPS_PER_FRAME;

  geometry = new THREE.BufferGeometry();

  var positions = [];
  var colors = [];

  var color = new THREE.Color();

  for (var i = 0; i < particles; i++) {
    // positions

    var x = 0;
    var y = 0;
    var z = 0;

    positions.push(x, y, z);

    // colors
    const c = randColor((i + randomColorWheelAdd) % ITERS);
    colors.push(c.r / 255, c.g / 255, c.b / 255);
  }

  geometry.addAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.addAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  minX = geometry.boundingBox.min.x;
  maxX = geometry.boundingBox.max.x;
  minY = geometry.boundingBox.min.y;
  maxY = geometry.boundingBox.max.y;

  //

  var material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: THREE.VertexColors
  });

  points = new THREE.Points(geometry, material);
  points.scale.x = plotScale;
  points.scale.y = -plotScale;
  camera.lookAt(0, 0, 0);
  scene.add(points);

  //

  // fading trails plane
  const planeGeo = new THREE.PlaneGeometry(8, 4);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x111213,
    transparent: true,
    opacity: 0.1
  });
  planeMat.blending = THREE.CustomBlending;
  planeMat.blendSrc = THREE.OneFactor;
  planeMat.blendDst = THREE.OneFactor;
  planeMat.blendEquation = THREE.ReverseSubtractEquation;
  const fadePlane = new THREE.Mesh(planeGeo, planeMat);
  scene.add(fadePlane);

  //

  renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClearColor = false;
  container.appendChild(renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("keydown", onKeyDown, false);
  window.addEventListener("keyup", onKeyUp, false);
  window.addEventListener("hashchange", onHashChange, false);
}

function onWindowResize() {
  // camera.aspect = window.innerWidth / window.innerHeight;
  // camera.updateProjectionMatrix();

  const aspectRatio = window.innerWidth / window.innerHeight;
  camera.left = -1 * aspectRatio;
  camera.right = 1 * aspectRatio;
  camera.bottom = -1;
  camera.top = 1;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const currentKeysDown = {};

function onKeyDown(e) {
  currentKeysDown[e.key] = true;
}

function onKeyUp(e) {
  currentKeysDown[e.key] = false;
}

function onHashChange(e) {
  const hash = window.location.hash.replace("#", "");
  params = stringToParams(hash);
  t = T_START;
}

//

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  geometry.attributes.position.needsUpdate = true; // required after the first render
  // geometry.attributes.color.needsUpdate = true;
  if (playing) {
    main();
    renderer.render(scene, camera);
  }
}

function main() {
  // Automatic restart
  if (t > T_END) {
    t = T_START;
  }

  const timeRate = (Date.now() - lastTime) / ONE_FRAME;
  lastTime = Date.now();

  // Fade last frame...?

  // Smooth out stepping speed
  const delta = DELTA_PER_STEP * speedMult;
  rollingDelta = rollingDelta * 0.99 + delta * 0.01;

  // Apply chaos
  for (let step = 0; step < STEPS_PER_FRAME; step++) {
    let isOffScreen = true;
    let x = t;
    let y = t;

    for (let iter = 0; iter < ITERS; iter++) {
      const xx = Math.min(Math.max(x * x, -FLT_MAX), FLT_MAX);
      const yy = Math.min(Math.max(y * y, -FLT_MAX), FLT_MAX);
      const tt = Math.min(Math.max(t * t, -FLT_MAX), FLT_MAX);
      const xy = Math.min(Math.max(x * y, -FLT_MAX), FLT_MAX);
      const xt = Math.min(Math.max(x * t, -FLT_MAX), FLT_MAX);
      const yt = Math.min(Math.max(y * t, -FLT_MAX), FLT_MAX);
      const xp = Math.min(Math.max(x, -FLT_MAX), FLT_MAX);
      const yp = Math.min(Math.max(y, -FLT_MAX), FLT_MAX);
      const tp = Math.min(Math.max(t, -FLT_MAX), FLT_MAX);
      let p = params.x;
      const nx =
        xx * p.xx +
        yy * p.yy +
        tt * p.tt +
        xy * p.xy +
        xt * p.xt +
        yt * p.yt +
        xp * p.x +
        yp * p.y +
        tp * p.t;
      p = params.y;
      const ny =
        xx * p.xx +
        yy * p.yy +
        tt * p.tt +
        xy * p.xy +
        xt * p.xt +
        yt * p.yt +
        xp * p.x +
        yp * p.y +
        tp * p.t;

      // Check if dynamic delta should be adjusted
      if (
        nx > camera.left / plotScale &&
        ny > camera.bottom / plotScale &&
        nx < camera.right / plotScale &&
        ny < camera.top / plotScale
      ) {
        const dx = history[iter] ? history[iter].x - nx : nx;
        const dy = history[iter] ? history[iter].y - ny : ny;
        const dist = 500 * Math.sqrt(dx * dx + dy * dy);
        rollingDelta = Math.min(
          rollingDelta,
          Math.max(delta / (dist + 1e-5), DELTA_MINIMUM * speedMult)
        );
        isOffScreen = false;
      }

      history[iter] = { x: nx, y: ny };

      // Draw pts...?
      geometry.attributes.position.array[(step * ITERS + iter) * 3] = nx;
      geometry.attributes.position.array[(step * ITERS + iter) * 3 + 1] = ny;
      x = nx;
      y = ny;
    }

    // Update t variable
    if (isOffScreen) {
      t += 0.01 * timeRate;
    } else {
      t += rollingDelta * timeRate;
    }
  }

  // Update UI
  // ui_time.innerText = t.toFixed(8);
}

init();
animate();

if (window.location.hash) {
  params = stringToParams(window.location.hash.replace("#", ""));
}

container.addEventListener("wheel", e => {
  e.preventDefault();
  return false;
});
