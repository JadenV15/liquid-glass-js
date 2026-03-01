# liquid-glass-js

`liquid-glass-js` is a lightweight Three.js-based library for drawing static liquid-glass shapes inside HTML containers.

## Features

- Three drawing APIs with shared lifecycle controls
- Automatic resize handling via `ResizeObserver`
- Physical glass material controls
- Gradient or image background support
- ESM-ready

## Install

```bash
npm install liquid-glass-js three
```

## Quick Usage

```js
import {
  drawLiquidCapsule,
  drawLiquidRect,
  drawLiquidEllipse,
} from "liquid-glass-js";

const capsule = drawLiquidCapsule(document.getElementById("capsule"), {
  shape: { ratio: 3.4 },
});

const rect = drawLiquidRect(document.getElementById("rect"), {
  shape: { ratio: 1.4, depth: 0.15, borderRadius: 0.08, rotationYDeg: -20 },
});

const ellipse = drawLiquidEllipse(document.getElementById("ellipse"), {
  shape: { majorDiameter: 0.62, minorDiameter: 0.52, rotationZDeg: 12 },
});

// runtime update
capsule.update({
  shape: {
    rotationYDeg: 28,
    translateX: -0.05,
    dilationY: 1.06,
  },
  material: {
    thickness: 0.72,
  },
});

const snapshot = capsule.getOptions();
```

Make sure each target container has explicit dimensions.

## API

### `drawLiquidCapsule(container, options?)`
### `drawLiquidRect(container, options?)`
### `drawLiquidEllipse(container, options?)`

Each function mounts a WebGL canvas into `container` and returns:

- `render(): void`
- `resize(): void`
- `update(nextOptions): void`
- `getOptions(): object`
- `destroy(): void`

Throws if `container` is not an `HTMLElement`.

## Options

### Root options

- `dpr: [number, number] | number` (default: `[1, 2]`)
- `bgColor: string` (default: `"#0e0f12"`)
- `bgOpacity: number` (default: `1`)
- `shape: ShapeOptions`
- `material: MaterialOptions`
- `background: BackgroundOptions`

### `shape`

Common sizing fields:

- `width?: number`
- `height?: number`
- `ratio?: number` (default: `3.4`)
- `radius?: number` (`width = radius * 2`)
- `rotationXDeg?: number` (default: `0`)
- `rotationYDeg?: number` (default: `0`)
- `rotationZDeg?: number` (default: `0`)
- `translateX?: number` (default: `0`)
- `translateY?: number` (default: `0`)
- `translateZ?: number` (default: `0`)
- `dilationX?: number` (default: `1`)
- `dilationY?: number` (default: `1`)
- `dilationZ?: number` (default: `1`)

Common sizing behavior:

- If both `width` and `height` are provided, both are used directly.
- If one is provided, the other is derived from `ratio`.
- If neither is provided, dimensions are auto-derived from container/camera using `ratio`.

Capsule-specific fields:

- `capSegments?: number` (default: `16`)
- `radialSegments?: number` (default: `64`)

Capsule constraint:

- Capsule `height` is the total height including both end caps.
- The resolved height must be greater than or equal to width (diameter).
- If not, `drawLiquidCapsule` throws an error.

Rectangle-specific fields:

- `depth?: number`
- `borderRadius?: number` (default: `0`)
- `borderRadiusSegments?: number` (default: `4`)

Ellipse-specific fields:

- `diameter?: number` for a circle
- `majorDiameter?: number` and `minorDiameter?: number` for an ellipse
- `segments?: number` (default: `64`)

Ellipse diameter rules:

- If `diameter` is set, a circle is drawn.
- If using ellipse diameters, both `majorDiameter` and `minorDiameter` must be set.
- If one is missing, `drawLiquidEllipse` throws an error.

### `material`

Maps to `THREE.MeshPhysicalMaterial`:

- `color` (default: `"#ffffff"`)
- `roughness` (default: `0.05`)
- `metalness` (default: `0`)
- `transmission` (default: `1`)
- `ior` (default: `1.45`)
- `thickness` (default: `0.55`)
- `reflectivity` (default: `0.6`)
- `clearcoat` (default: `0.2`)
- `clearcoatRoughness` (default: `0.1`)
- `iridescence` (default: `0.8`)
- `iridescenceIOR` (default: `1.0`)
- `iridescenceThicknessRange` (default: `[120, 360]`)
- `attenuationColor` (default: `"#ffffff"`)
- `attenuationDistance` (default: `0.75`)

### `background`

- `{ type: "gradient" }` (default)
- `{ type: "image", imageUrl: string }`

## Local Demo

```bash
npm install
npm run demo
```

Open the URL printed by your server.

## Credits

Inspired by and based on ideas from:

- [ektogamat/apple-liquid-glass](https://github.com/ektogamat/apple-liquid-glass)
