import { createLiquidGlass } from "./src/index.js";

const container = document.getElementById("glass");

const tube = createLiquidGlass(container, {
  capsule: {
    ratio: 3.6,
    radialSegments: 64,
  },
  material: {
    transmission: 1,
    ior: 1.5,
    thickness: 0.65,
    reflectivity: 0.65,
    roughness: 0.04,
    clearcoat: 0.35,
  },
  background: {
    type: "gradient",
  },
});

window.addEventListener("beforeunload", () => tube.destroy());
