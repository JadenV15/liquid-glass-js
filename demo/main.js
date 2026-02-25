import { createLiquidGlass } from "../src/index.js";

const container = document.getElementById("glass");

const tube = createLiquidGlass(container, {
  cylinder: {
    radiusTop: 0.16,
    radiusBottom: 0.16,
    height: 1.1,
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
