import { drawLiquidCapsule, drawLiquidRect, drawLiquidEllipse } from "./src/index.js";

const capsuleContainer = document.getElementById("glass-capsule");
const rectContainer = document.getElementById("glass-rect");
const ellipseContainer = document.getElementById("glass-ellipse");

if (!capsuleContainer || !rectContainer || !ellipseContainer) {
  throw new Error("Demo container elements were not found.");
}

const sharedMaterial = {
  transmission: 1,
  ior: 1.5,
  thickness: 0.62,
  reflectivity: 0.64,
  roughness: 0.04,
  clearcoat: 0.35,
};

const capsule = drawLiquidCapsule(capsuleContainer, {
  shape: {
    ratio: 3.6,
    radialSegments: 64,
    rotationYDeg: 18,
    rotationXDeg: -6,
    rotationZDeg: 9,
    translateX: -0.02,
    dilationY: 1.03,
  },
  material: sharedMaterial,
  background: {
    type: "gradient",
  },
});

const rect = drawLiquidRect(rectContainer, {
  shape: {
    ratio: 1.35,
    depth: 0.16,
    borderRadius: 0.08,
    borderRadiusSegments: 6,
    rotationYDeg: -24,
    rotationZDeg: 8,
    translateY: 0.02,
    dilationX: 0.95,
  },
  material: sharedMaterial,
  background: {
    type: "gradient",
  },
});

const ellipse = drawLiquidEllipse(ellipseContainer, {
  shape: {
    majorDiameter: 0.64,
    minorDiameter: 0.52,
    segments: 72,
    rotationXDeg: 10,
    rotationYDeg: 14,
    rotationZDeg: -12,
    dilationY: 0.9,
  },
  material: sharedMaterial,
  background: {
    type: "gradient",
  },
});

window.addEventListener("beforeunload", () => {
  capsule.destroy();
  rect.destroy();
  ellipse.destroy();
});
