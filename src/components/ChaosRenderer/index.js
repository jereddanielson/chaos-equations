import React from "react";
const THREE = require("three");
const statsjs = require("stats-js");
const stats = new statsjs();

import chaos from "./chaos.js";
import { SIM_TICK_MS, SIM_FRAME_BUDGET_MS } from "./constants.js";

/**
 * @typedef {Object} Color
 * @property {number} r Red value, range 0.0 - 1.0
 * @property {number} g Green value, range 0.0 - 1.0
 * @property {number} b Blue value, range 0.0 - 1.0
 */

/**
 * ChaosRender is a component that encapsulates dynamic chaos equation rendering.
 * It handles creating and handling THREE.js renderer.
 */
export default class ChaosRenderer extends React.Component {
  /**
   * Checks that WebGL is supported by browser
   * @returns {boolean}
   */
  static isWebGLAvailable() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }
  /**
   * Generate RGB color based on input number and HSL color wheel position
   * @param {number} i Input number
   * @returns {Color}
   */
  static getWheelColor(i) {
    const c = new THREE.Color("hsl(" + (i % 360) + ", 100%, 50%)");
    return { r: c.r, g: c.g, b: c.b };
  }
  /**
   * Generate quasi-random color based on input number
   * @param {number} i Input number
   * @returns {Color}
   */
  static getRandColor(i) {
    const n = i + 1;
    const r = Math.min(255, 50 + ((n * 11909) % 256));
    const g = Math.min(255, 50 + ((n * 52973) % 256));
    const b = Math.min(255, 50 + ((n * 44111) % 256));
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  /**
   * Fills a color buffer so that each point is colored by its iteration
   * @param {Float32Array} colors RGB values for numSteps * numIters points
   * @param {object} options
   * @param {number} options.numIters Iterations per step
   * @param {number} options.colorSpread Multiplier applied to the iteration
   * @param {number} options.colorOffset Added to the iteration
   * @param {boolean} options.rainbowColors Use the color wheel, not the original palette
   */
  static fillColors(colors, { numIters, colorSpread, colorOffset, rainbowColors }) {
    const getColor = rainbowColors
      ? ChaosRenderer.getWheelColor
      : ChaosRenderer.getRandColor;
    const palette = [];
    for (let iter = 0; iter < numIters; iter++) {
      palette.push(
        getColor(Math.round(iter * colorSpread + colorOffset) % numIters)
      );
    }
    for (let i = 0; i < colors.length / 3; i++) {
      const c = palette[i % numIters];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
  }
  componentDidMount() {
    // Try to start up THREE.js
    if (ChaosRenderer.isWebGLAvailable()) {
      // Renderer and canvas
      const { element, props } = this;
      const renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true, // allows for fancy fading trails
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(element.offsetWidth, element.offsetHeight);
      renderer.autoClearColor = false; // allows for fancy fading trails
      element.innerHTML = "";
      element.appendChild(renderer.domElement);
      this.renderer = renderer;

      // Camera
      const aspectRatio = element.offsetWidth / element.offsetHeight;
      const camera = new THREE.OrthographicCamera(
        -1 * aspectRatio,
        1 * aspectRatio,
        1,
        -1,
        0.1,
        20
      );
      camera.position.set(0, 0, 1);
      this.aspectRatio = aspectRatio;
      this.camera = camera;

      // Scene and geometry
      const {
        numIters = 800,
        numSteps = 500,
        colorSpread = 1,
        colorOffset = 0,
        rainbowColors = false,
        pointSize = 1,
        trailPersistence = 1 - 10 / 255,
      } = props;
      const scene = new THREE.Scene();
      this.scene = scene;
      const numPoints = numIters * numSteps;

      // Positions start at 0 - center of screen
      const positionsArray = new Float32Array(numPoints * 3);
      const colorsArray = new Float32Array(numPoints * 3);
      ChaosRenderer.fillColors(colorsArray, {
        numIters,
        colorSpread,
        colorOffset,
        rainbowColors,
      });

      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute(
        "position",
        new THREE.Float32BufferAttribute(positionsArray, 3)
      );
      geometry.addAttribute(
        "color",
        new THREE.Float32BufferAttribute(colorsArray, 3)
      );
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      this.geometry = geometry;

      const { attenuation = 0.937 } = this.props;
      const pointsMaterial = new THREE.PointsMaterial({
        size: pointSize,
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 1 - attenuation,
        // blending: THREE.AdditiveBlending,
      });
      // WebGL draws square points, so trim them to circles
      pointsMaterial.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_particle_fragment>",
          "if (length(gl_PointCoord - 0.5) > 0.5) discard;\n#include <map_particle_fragment>"
        );
      };

      // chaos.js applies zoom and panning, so this only flips y to point down
      const points = new THREE.Points(geometry, pointsMaterial);
      points.scale.y = -1;
      camera.lookAt(0, 0, 0);
      scene.add(points);
      this.points = points;

      // Fading trails plane
      const fade = 1 - trailPersistence;
      const fadeColor = new THREE.Color(fade, fade, fade);
      const fadeGeometry = new THREE.PlaneGeometry(
        camera.right * 8,
        camera.top * 8
      );
      const fadeMaterial = new THREE.MeshBasicMaterial({
        color: fadeColor,
      });
      fadeMaterial.blending = THREE.CustomBlending;
      fadeMaterial.blendSrc = THREE.OneFactor;
      fadeMaterial.blendDst = THREE.OneFactor;
      fadeMaterial.blendEquation = THREE.ReverseSubtractEquation;
      const fadePlane = new THREE.Mesh(fadeGeometry, fadeMaterial);
      scene.add(fadePlane);
      this.fadePlane = fadePlane;

      // Kick off scene render loop
      // Normally this is bad but in this case I need it to be more performant
      // than being kept in React state.
      this.t = window.CHAOS_TIME.get();
      window.CHAOS_TIME.addEventListener("skip", () => {
        this.renderFrame();
      });
      this.applyChaos = chaos.bind(this);
      this.lastFrameTime = performance.now();
      // Start mid-tick so timestamp jitter on a 60Hz display can't alternate
      // between zero and two ticks per frame
      this.tickAccumulator = SIM_TICK_MS / 2;
      this.animate();

      // Event listeners
      window.addEventListener("resize", this.onWindowResize);
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      [
        "MouseEnter",
        "MouseLeave",
        "MouseDown",
        "MouseMove",
        "MouseUp",
        "Wheel",
        "Click",
        "TouchStart",
        "TouchMove",
        "TouchEnd",
      ].forEach(ea => {
        if (typeof this.props[`on${ea}`] === "function") {
          renderer.domElement.addEventListener(ea.toLowerCase(), e => {
            e.preventDefault();
            this.props[`on${ea}`](e, camera, renderer.domElement);
          });
        }
      });

      // Stats
      stats.showPanel(0);
      stats.dom.style.right = 0;
      stats.dom.style.bottom = "2rem";
      stats.dom.style.left = "";
      stats.dom.style.top = "";
      stats.dom.style.visibility = this.props.showStats ? "visible" : "hidden";
      document.body.appendChild(stats.dom);
      this.stats = stats;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { props, geometry, points, fadePlane, stats } = this;
    let shouldRenderFrame = false;
    if (prevProps.params !== props.params) {
      this.clearOnNextRender = true;
    }
    if (prevProps.scaleFactor !== props.scaleFactor) {
      shouldRenderFrame = true;
    }
    if (prevProps.xPos !== props.xPos) {
      shouldRenderFrame = true;
    }
    if (prevProps.yPos !== props.yPos) {
      shouldRenderFrame = true;
    }
    if (prevProps.attenuation !== props.attenuation) {
      points.material.opacity = Math.min(
        Math.max(1 - props.attenuation, 0.01),
        0.99
      );
      console.log(points.material.opacity);
      shouldRenderFrame = true;
    }
    if (prevProps.trailPersistence !== props.trailPersistence) {
      const fade = 1 - props.trailPersistence;
      fadePlane.material.color.setRGB(fade, fade, fade);
      shouldRenderFrame = true;
    }
    if (prevProps.showStats !== props.showStats) {
      stats.dom.style.visibility = props.showStats ? "visible" : "hidden";
    }
    if (
      prevProps.colorOffset !== props.colorOffset ||
      prevProps.colorSpread !== props.colorSpread ||
      prevProps.rainbowColors !== props.rainbowColors
    ) {
      ChaosRenderer.fillColors(geometry.attributes.color.array, props);
      geometry.attributes.color.needsUpdate = true;
      shouldRenderFrame = true;
    }
    if (prevProps.pointSize !== props.pointSize) {
      points.material.size = props.pointSize;
      shouldRenderFrame = true;
    }
    shouldRenderFrame && this.renderFrame();
  }

  onWindowResize = () => {
    const { camera, renderer, element } = this;
    const aspectRatio = element.offsetWidth / element.offsetHeight;
    camera.left = -1 * aspectRatio;
    camera.right = 1 * aspectRatio;
    camera.bottom = -1;
    camera.top = 1;
    camera.updateProjectionMatrix();
    renderer.setSize(element.offsetWidth, element.offsetHeight);
    this.aspectRatio = aspectRatio;
  };

  // requestAnimationFrame doesn't fire in a hidden tab, so ignore the time spent
  // hidden and the simulation resumes where it left off
  onVisibilityChange = () => {
    this.lastFrameTime = performance.now();
  };

  animate = () => {
    const {
      animate,
      tick,
      props: { isPlaying = true, showStats },
    } = this;

    showStats && stats.begin();

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (isPlaying && !window.CHAOS_TIME.paused) {
      this.tickAccumulator += elapsed;

      while (this.tickAccumulator >= SIM_TICK_MS) {
        tick();
        this.tickAccumulator -= SIM_TICK_MS;

        // Too slow to keep up, so drop the backlog and let the simulation run
        // slower. Catching up would only add work and make it fall further behind.
        if (performance.now() - now >= SIM_FRAME_BUDGET_MS) {
          this.tickAccumulator %= SIM_TICK_MS;
          break;
        }
      }
    }

    showStats && stats.end();

    requestAnimationFrame(animate);
  };

  /**
   * Advances the simulation one fixed step. Each tick fades and draws to the
   * canvas, so trails accumulate the same regardless of display refresh rate.
   */
  tick = () => {
    this.renderFrame();

    if (this.t > (this.props.tMax !== undefined ? this.props.tMax : 3)) {
      this.t = this.props.tMin !== undefined ? this.props.tMin : -3;
      this.clearOnNextRender = true;
      if (
        !this.props.repeat &&
        !window.CHAOS_TIME.paused &&
        this.props.onGenerateNewRandomParams
      ) {
        this.props.onGenerateNewRandomParams();
      }
    } else if (
      this.t < (this.props.tMin !== undefined ? this.props.tMin : -3)
    ) {
      this.t = this.props.tMax;
    }

    window.CHAOS_TIME.set(this.t);
  };

  renderFrame = () => {
    const { geometry, renderer, scene, camera, applyChaos } = this;
    this.t = window.CHAOS_TIME.get();
    applyChaos();
    geometry.attributes.position.needsUpdate = true; // required after the first render
    if (this.clearOnNextRender) {
      renderer.clear(true, false, false);
      this.clearOnNextRender = false;
    }
    renderer.render(scene, camera);
  };

  render() {
    return (
      <div
        ref={el => {
          this.element = el;
        }}
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Your browser does not support WebGL :'(
        </div>
      </div>
    );
  }
}
