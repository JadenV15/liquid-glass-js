# liquid-glass-js

A tiny JavaScript library that mounts a **static liquid-glass capsule** inside any `<div>` container.

This is intentionally focused on the core glass effect (no pointer/mouse animations).

## Install

```bash
npm install liquid-glass-js three
```

## Usage

```js
import { createLiquidGlass } from "liquid-glass-js";

const container = document.getElementById("glass");

const instance = createLiquidGlass(container, {
  capsule: {
    width: 0.22,
    // height: 0.78,
    ratio: 3.5,
    capSegments: 18,
    radialSegments: 64,
  },
  material: {
    ior: 1.45,
    thickness: 0.6,
    roughness: 0.04,
  },
  background: {
    type: "gradient",
    // type: "image",
    // imageUrl: "/my-background.jpg",
  },
});

// Later
// instance.destroy();
```

## API

### `createLiquidGlass(container, options?)`

- `container` (`HTMLElement`) – target container where the canvas is mounted.
- `options` (`object`) – optional config.

Returns:

- `render()`
- `resize()`
- `destroy()`

### Options

- `dpr: [min, max] | number`
- `bgColor: string`
- `bgOpacity: number`
- `capsule`:
  - `width?: number`
  - `height?: number`
  - `ratio?: number` (defaults to `3.4`, used when one or both dimensions are omitted)
  - `radius?: number` (optional alias for `width / 2`)
  - `capSegments?: number`
  - `radialSegments?: number`
- `material`: physical glass material values (`transmission`, `ior`, `thickness`, `reflectivity`, ...)
- `background`:
  - `{ type: "gradient" }` (default)
  - `{ type: "image", imageUrl: string }`

Capsule sizing behavior:

- if both `width` and `height` are provided, those exact values are used
- if only one dimension is provided, the other is derived from `ratio`
- if neither is provided, the capsule is centered and auto-sized from the container's width/height

## Local demo

```bash
cd liquid-glass-js
npm install
npm run demo
```

Open `http://localhost:4173`.
