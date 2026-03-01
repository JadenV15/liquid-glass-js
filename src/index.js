import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const DEFAULT_OPTIONS = {
  dpr: [1, 2],
  bgColor: "#0e0f12",
  bgOpacity: 1,
  shape: {
    width: null,
    height: null,
    ratio: 3.4,
    radius: null,
    depth: null,
    borderRadius: 0,
    borderRadiusSegments: 4,
    segments: 64,
    capSegments: 16,
    radialSegments: 64,
    diameter: null,
    majorDiameter: null,
    minorDiameter: null,
    rotationXDeg: 0,
    rotationYDeg: 0,
    rotationZDeg: 0,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    dilationX: 1,
    dilationY: 1,
    dilationZ: 1,
  },
  material: {
    color: "#ffffff",
    roughness: 0.05,
    metalness: 0,
    transmission: 1,
    ior: 1.45,
    thickness: 0.55,
    reflectivity: 0.6,
    clearcoat: 0.2,
    clearcoatRoughness: 0.1,
    iridescence: 0.8,
    iridescenceIOR: 1.0,
    iridescenceThicknessRange: [120, 360],
    attenuationColor: "#ffffff",
    attenuationDistance: 0.75,
  },
  background: {
    type: "gradient",
    imageUrl: null,
  },
};

function deepMerge(base, override) {
  if (!override) return { ...base };
  const output = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof base[key] === "object" &&
      base[key] !== null
    ) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function makeGradientTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#2a2f57");
  grad.addColorStop(0.45, "#873c7f");
  grad.addColorStop(1, "#1f6f72");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 36 + 10;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function toPixelRatio(value) {
  if (Array.isArray(value)) {
    const max = value[1] ?? value[0] ?? 2;
    return Math.min(window.devicePixelRatio || 1, max);
  }
  return value;
}

function toPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function toFiniteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toScaleNumber(value, fallback = 1) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeOptions(options) {
  const merged = deepMerge(DEFAULT_OPTIONS, options);
  return merged.shape ? merged : { ...merged, shape: { ...DEFAULT_OPTIONS.shape } };
}

function cloneOptions(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function resolveAutoDimensions(shapeConfig, camera) {
  const ratio = toPositiveNumber(shapeConfig.ratio) ?? DEFAULT_OPTIONS.shape.ratio;

  let width = toPositiveNumber(shapeConfig.width);
  const height = toPositiveNumber(shapeConfig.height);

  if (!width) {
    const radius = toPositiveNumber(shapeConfig.radius);
    if (radius) width = radius * 2;
  }

  if (width && height) return { width, height };
  if (width) return { width, height: width * ratio };
  if (height) return { width: height / ratio, height };

  const distance = Math.max(0.001, camera.position.z);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const viewportHeight = 2 * Math.tan(verticalFov / 2) * distance;
  const viewportWidth = viewportHeight * camera.aspect;

  const maxAutoHeight = viewportHeight * 0.72;
  const maxAutoWidth = viewportWidth * 0.42;

  let autoHeight = maxAutoHeight;
  let autoWidth = autoHeight / ratio;

  if (autoWidth > maxAutoWidth) {
    autoWidth = maxAutoWidth;
    autoHeight = autoWidth * ratio;
  }

  return { width: autoWidth, height: autoHeight };
}

function resolveEllipseDimensions(shapeConfig, camera, fnName) {
  const diameter = toPositiveNumber(shapeConfig.diameter);
  const majorDiameter = toPositiveNumber(shapeConfig.majorDiameter);
  const minorDiameter = toPositiveNumber(shapeConfig.minorDiameter);

  if (diameter) return { width: diameter, height: diameter };

  if (majorDiameter || minorDiameter) {
    if (!majorDiameter || !minorDiameter) {
      throw new Error(`${fnName}: shape.majorDiameter and shape.minorDiameter must both be provided.`);
    }
    return { width: majorDiameter, height: minorDiameter };
  }

  return resolveAutoDimensions(shapeConfig, camera);
}

function resolveDimensions(kind, shapeConfig, camera, fnName) {
  if (kind === "ellipse") {
    return resolveEllipseDimensions(shapeConfig, camera, fnName);
  }
  return resolveAutoDimensions(shapeConfig, camera);
}

function validateCapsuleDimensions(width, height, fnName) {
  if (height < width) {
    throw new Error(
      `${fnName}: invalid dimensions. Capsule height includes both end caps and must be >= width (diameter).`
    );
  }
}

function createGeometry(kind, shapeConfig, dimensions, fnName) {
  const width = Math.max(0.001, dimensions.width);
  const height = Math.max(0.001, dimensions.height);

  if (kind === "capsule") {
    validateCapsuleDimensions(width, height, fnName);
    const radius = Math.max(0.001, width / 2);
    const length = Math.max(0.001, height - radius * 2);
    return new THREE.CapsuleGeometry(radius, length, shapeConfig.capSegments, shapeConfig.radialSegments);
  }

  if (kind === "rect") {
    const depth = toPositiveNumber(shapeConfig.depth) ?? Math.max(0.001, Math.min(width, height) * 0.34);
    const radiusRaw = toPositiveNumber(shapeConfig.borderRadius) ?? 0;
    const radius = Math.min(radiusRaw, width / 2, height / 2, depth / 2);
    const segments = Math.max(1, Math.round(toPositiveNumber(shapeConfig.borderRadiusSegments) ?? 4));
    if (radius > 0) {
      return new RoundedBoxGeometry(width, height, depth, segments, radius);
    }
    return new THREE.BoxGeometry(width, height, depth);
  }

  const radius = 0.5;
  const segments = Math.max(8, Math.round(toPositiveNumber(shapeConfig.segments) ?? 64));
  const rings = Math.max(6, Math.round(segments * 0.75));
  return new THREE.SphereGeometry(radius, segments, rings);
}

function applyShapeScale(kind, mesh, dimensions, shapeConfig) {
  const sx = toScaleNumber(shapeConfig.dilationX, 1);
  const sy = toScaleNumber(shapeConfig.dilationY, 1);
  const sz = toScaleNumber(shapeConfig.dilationZ, 1);

  if (kind === "ellipse") {
    const ex = Math.max(0.001, dimensions.width);
    const ey = Math.max(0.001, dimensions.height);
    mesh.scale.set(ex * sx, ey * sy, ex * sz);
    return;
  }
  mesh.scale.set(sx, sy, sz);
}

function applyShapeRotation(mesh, shapeConfig) {
  const x = THREE.MathUtils.degToRad(toFiniteNumber(shapeConfig.rotationXDeg, 0));
  const y = THREE.MathUtils.degToRad(toFiniteNumber(shapeConfig.rotationYDeg, 0));
  const z = THREE.MathUtils.degToRad(toFiniteNumber(shapeConfig.rotationZDeg, 0));
  mesh.rotation.set(x, y, z);
  mesh.position.set(
    toFiniteNumber(shapeConfig.translateX, 0),
    toFiniteNumber(shapeConfig.translateY, 0),
    toFiniteNumber(shapeConfig.translateZ, 0)
  );
}

function drawLiquidShape(container, options = {}, kind, fnName) {
  if (!(container instanceof HTMLElement)) {
    throw new Error(`${fnName}(container, options): container must be an HTMLElement.`);
  }

  let config = normalizeOptions(options);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(toPixelRatio(config.dpr));
  renderer.setClearColor(config.bgColor, config.bgOpacity);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(25, 1, 0.01, 100);
  camera.position.set(0, 0, 2.35);

  const fillLight = new THREE.DirectionalLight("#ffffff", 2.4);
  fillLight.position.set(0.8, 1.2, 1.4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight("#c8d8ff", 0.9);
  rimLight.position.set(-1.2, -0.6, 1.1);
  scene.add(rimLight);

  const backgroundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 3.8),
    new THREE.MeshBasicMaterial({ toneMapped: false })
  );
  backgroundPlane.position.set(0, 0, -0.8);
  scene.add(backgroundPlane);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: config.material.color,
    roughness: config.material.roughness,
    metalness: config.material.metalness,
    transmission: config.material.transmission,
    ior: config.material.ior,
    thickness: config.material.thickness,
    reflectivity: config.material.reflectivity,
    clearcoat: config.material.clearcoat,
    clearcoatRoughness: config.material.clearcoatRoughness,
    iridescence: config.material.iridescence,
    iridescenceIOR: config.material.iridescenceIOR,
    iridescenceThicknessRange: config.material.iridescenceThicknessRange,
    attenuationColor: config.material.attenuationColor,
    attenuationDistance: config.material.attenuationDistance,
  });

  let shapeGeometry = createGeometry(kind, config.shape, { width: 0.1, height: 0.1 }, fnName);
  const shapeMesh = new THREE.Mesh(shapeGeometry, glassMaterial);
  scene.add(shapeMesh);
  let currentDimensions = { width: 0.1, height: 0.1 };

  let bgTexture = null;

  function applyRendererConfig() {
    renderer.setPixelRatio(toPixelRatio(config.dpr));
    renderer.setClearColor(config.bgColor, config.bgOpacity);
  }

  function applyMaterialConfig() {
    glassMaterial.color.set(config.material.color);
    glassMaterial.roughness = config.material.roughness;
    glassMaterial.metalness = config.material.metalness;
    glassMaterial.transmission = config.material.transmission;
    glassMaterial.ior = config.material.ior;
    glassMaterial.thickness = config.material.thickness;
    glassMaterial.reflectivity = config.material.reflectivity;
    glassMaterial.clearcoat = config.material.clearcoat;
    glassMaterial.clearcoatRoughness = config.material.clearcoatRoughness;
    glassMaterial.iridescence = config.material.iridescence;
    glassMaterial.iridescenceIOR = config.material.iridescenceIOR;
    glassMaterial.iridescenceThicknessRange = config.material.iridescenceThicknessRange;
    glassMaterial.attenuationColor = new THREE.Color(config.material.attenuationColor);
    glassMaterial.attenuationDistance = config.material.attenuationDistance;
    glassMaterial.needsUpdate = true;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function applyBackgroundTexture() {
    if (bgTexture) bgTexture.dispose();

    if (config.background.type === "image" && config.background.imageUrl) {
      bgTexture = new THREE.TextureLoader().load(config.background.imageUrl, () => {
        render();
      });
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      backgroundPlane.material.map = bgTexture;
      backgroundPlane.material.needsUpdate = true;
      return;
    }

    bgTexture = makeGradientTexture();
    backgroundPlane.material.map = bgTexture;
    backgroundPlane.material.needsUpdate = true;
  }

  function updateShapeGeometry() {
    const dimensions = resolveDimensions(kind, config.shape, camera, fnName);
    currentDimensions = dimensions;
    const nextGeometry = createGeometry(kind, config.shape, dimensions, fnName);
    shapeMesh.geometry.dispose();
    shapeMesh.geometry = nextGeometry;
    shapeGeometry = nextGeometry;
    applyShapeScale(kind, shapeMesh, dimensions, config.shape);
    applyShapeRotation(shapeMesh, config.shape);
  }

  function setShapeTransform(nextShape = {}) {
    config.shape = deepMerge(config.shape, nextShape);
    applyShapeScale(kind, shapeMesh, currentDimensions, config.shape);
    applyShapeRotation(shapeMesh, config.shape);
    render();
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    renderer.setSize(width, height, true);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateShapeGeometry();
    render();
  }

  function update(nextOptions = {}) {
    config = normalizeOptions(deepMerge(config, nextOptions));
    applyRendererConfig();
    applyMaterialConfig();
    applyBackgroundTexture();
    resize();
  }

  function getOptions() {
    return cloneOptions(config);
  }

  applyRendererConfig();
  applyMaterialConfig();
  applyBackgroundTexture();
  resize();

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);

  return {
    render,
    resize,
    update,
    setShapeTransform,
    getOptions,
    destroy() {
      resizeObserver.disconnect();

      if (bgTexture) bgTexture.dispose();
      shapeGeometry.dispose();
      glassMaterial.dispose();
      backgroundPlane.geometry.dispose();
      backgroundPlane.material.dispose();
      pmrem.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

export function drawLiquidCapsule(container, options = {}) {
  return drawLiquidShape(container, options, "capsule", "drawLiquidCapsule");
}

export function drawLiquidRect(container, options = {}) {
  return drawLiquidShape(container, options, "rect", "drawLiquidRect");
}

export function drawLiquidEllipse(container, options = {}) {
  return drawLiquidShape(container, options, "ellipse", "drawLiquidEllipse");
}

export default drawLiquidCapsule;
