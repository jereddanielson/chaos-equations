import React from "react";
const THREE = require("three");
const statsjs = require("stats-js");
const stats = new statsjs();

import chaos, { loadChaos } from "./chaos.js";

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
    const r = Math.min(255, 50 + ((i * 11909) % 256));
    const g = Math.min(255, 50 + ((i * 52973) % 256));
    const b = Math.min(255, 50 + ((i * 44111) % 256));
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  componentDidMount() {
    // Try to start up THREE.js
    if (ChaosRenderer.isWebGLAvailable()) {
      const cfg = {
        x_xx: this.props.params.x.xx,
        x_yy: this.props.params.x.yy,
        x_tt: this.props.params.x.tt,
        x_xy: this.props.params.x.xy,
        x_xt: this.props.params.x.xt,
        x_yt: this.props.params.x.yt,
        x_x: this.props.params.x.x,
        x_y: this.props.params.x.y,
        x_t: this.props.params.x.t,
        y_xx: this.props.params.y.xx,
        y_yy: this.props.params.y.yy,
        y_tt: this.props.params.y.tt,
        y_xy: this.props.params.y.xy,
        y_xt: this.props.params.y.xt,
        y_yt: this.props.params.y.yt,
        y_x: this.props.params.y.x,
        y_y: this.props.params.y.y,
        y_t: this.props.params.y.t,
        NUM_STEPS: this.props.numSteps,
        NUM_ITERS: this.props.numIters
      };
      loadChaos(cfg).then(([wasmMemory, chaosFunction]) => {
        window.wasmMemory = wasmMemory;
        // Renderer and canvas
        const { element, props } = this;
        const renderer = new THREE.WebGLRenderer({
          preserveDrawingBuffer: true, // allows for fancy fading trails
          antialias: true,
          powerPreference: "high-performance"
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
          colorSpread = 4,
          colorOffset = 0,
          pointSize = 1,
          scaleFactor = 1,
          trailPersistence = 0.03
        } = props;
        const scene = new THREE.Scene();
        this.scene = scene;
        const numPoints = numIters * numSteps;

        const positionsArray = [];
        const colorsArray = [];

        wasmMemory.forEach((_ea, i) => {
          wasmMemory[i] = 0;
        });

        for (var i = 0; i < numPoints; i++) {
          // Positions start at 0 - center of screen
          // positionsArray[3 * i] = 0;
          // positionsArray[3 * (i + 1)] = 0;
          // positionsArray[3 * (i + 2)] = 0;
          positionsArray.push(0, 0, 0);

          // Depending on color mode, create color for point
          const c = ChaosRenderer.getWheelColor(
            (i * colorSpread + colorOffset) % numIters
          );
          colorsArray.push(c.r, c.g, c.b);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute(
          "position",
          new THREE.Float32BufferAttribute(positionsArray, 3)
        );
        geometry.addAttribute(
          "color",
          new THREE.Float32BufferAttribute(colorsArray, 3)
        );
        geometry.attributes.position.array = wasmMemory;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        this.geometry = geometry;

        const { attenuation = 0.85 } = this.props;
        const pointsMaterial = new THREE.PointsMaterial({
          size: pointSize,
          vertexColors: THREE.VertexColors,
          transparent: true,
          opacity: 1 - attenuation
          // blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(geometry, pointsMaterial);
        points.scale.x = scaleFactor;
        points.scale.y = -scaleFactor;
        camera.lookAt(0, 0, 0);
        scene.add(points);
        this.points = points;

        // Fading trails plane
        const tpVal = 1 - trailPersistence;
        const fadeColor = new THREE.Color(tpVal, tpVal, tpVal);
        const fadeGeometry = new THREE.PlaneGeometry(
          camera.right * 8,
          camera.top * 8
        );
        const fadeMaterial = new THREE.MeshBasicMaterial({
          color: fadeColor
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
        // this.applyChaos = chaos.bind(this);
        this.animate();

        // Event listeners
        window.addEventListener("resize", this.onWindowResize);
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
          "TouchEnd"
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
        stats.dom.style.visibility = this.props.showStats
          ? "visible"
          : "hidden";
        document.body.appendChild(stats.dom);
        this.stats = stats;

        // Make chaosFunction available
        this.chaosFunction = chaosFunction;
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { props, geometry, points, fadePlane, stats } = this;
    const { numIters, colorSpread, colorOffset } = this.props;
    let shouldRenderFrame = false;
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
      const tpVal = 1 - props.trailPersistence * props.trailPersistence;
      fadePlane.material.color.setRGB(tpVal, tpVal, tpVal);
      shouldRenderFrame = true;
    }
    if (prevProps.showStats !== props.showStats) {
      stats.dom.style.visibility = props.showStats ? "visible" : "hidden";
    }
    if (
      prevProps.colorOffset !== props.colorOffset ||
      prevProps.colorSpread !== props.colorSpread
    ) {
      const colorsArray = geometry.attributes.color.array;
      for (let i = 0; i < colorsArray.length; i += 3) {
        const c = ChaosRenderer.getWheelColor(
          (i * colorSpread + colorOffset) % numIters
        );
        colorsArray[i] = c.r;
        colorsArray[i + 1] = c.g;
        colorsArray[i + 2] = c.b;
      }
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

  animate = () => {
    showStats && stats.begin();

    const {
      animate,
      renderFrame,
      props: { isPlaying = true, showStats }
    } = this;

    if (isPlaying && !window.CHAOS_TIME.paused) {
      renderFrame();

      if (this.t > (this.props.tMax !== undefined ? this.props.tMax : 3)) {
        this.t = this.props.tMin !== undefined ? this.props.tMin : -3;
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
    }

    showStats && stats.end();

    requestAnimationFrame(animate);
  };

  renderFrame = () => {
    if (this.chaosFunction) {
      const { geometry, renderer, scene, camera, applyChaos } = this;
      this.t = window.CHAOS_TIME.get();
      // applyChaos();
      const newT = this.chaosFunction(
        this.t,
        this.props.xPos,
        this.props.yPos,
        this.props.scaleFactor,
        this.props.timeFactor
      );
      this.t = newT;
      window.CHAOS_TIME.set(newT);
      geometry.attributes.position.needsUpdate = true; // required after the first render
      renderer.render(scene, camera);
    }
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
            justifyContent: "center"
          }}
        >
          Your browser does not support WebGL :'(
        </div>
      </div>
    );
  }
}
