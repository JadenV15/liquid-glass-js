import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const DEFAULT_OPTIONS = {
  dpr: [1, 2],
  bgColor: "#0e0f12",
  bgOpacity: 1,
  cylinder: {
    radiusTop: 0.13,
    radiusBottom: 0.13,
    height: 0.9,
    radialSegments: 96,
    heightSegments: 1,
    openEnded: true,
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
      typeof base[key] === "object"
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

  const noiseCount = 220;
  for (let i = 0; i < noiseCount; i += 1) {
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

export function createLiquidGlass(container, options = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new Error("createLiquidGlass(container, options): container must be an HTMLElement.");
  }

  const config = deepMerge(DEFAULT_OPTIONS, options);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(toPixelRatio(config.dpr));
  renderer.setClearColor(config.bgColor, config.bgOpacity);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.25;

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

  const tubeGeometry = new THREE.CylinderGeometry(
    config.cylinder.radiusTop,
    config.cylinder.radiusBottom,
    config.cylinder.height,
    config.cylinder.radialSegments,
    config.cylinder.heightSegments,
    config.cylinder.openEnded
  );

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
    side: THREE.DoubleSide,
  });

  const tube = new THREE.Mesh(tubeGeometry, glassMaterial);
  scene.add(tube);

  const capTop = new THREE.Mesh(
    new THREE.CircleGeometry(config.cylinder.radiusTop, config.cylinder.radialSegments),
    glassMaterial
  );
  capTop.position.y = config.cylinder.height / 2;
  capTop.rotation.x = -Math.PI / 2;
  scene.add(capTop);

  const capBottom = new THREE.Mesh(
    new THREE.CircleGeometry(config.cylinder.radiusBottom, config.cylinder.radialSegments),
    glassMaterial
  );
  capBottom.position.y = -config.cylinder.height / 2;
  capBottom.rotation.x = Math.PI / 2;
  scene.add(capBottom);

  let bgTexture = null;

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

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  applyBackgroundTexture();
  resize();

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);

  return {
    render,
    resize,
    destroy() {
      resizeObserver.disconnect();

      if (bgTexture) bgTexture.dispose();
      tubeGeometry.dispose();
      capTop.geometry.dispose();
      capBottom.geometry.dispose();
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

export default createLiquidGlass;
