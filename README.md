# liquid-glass-js

A tiny JavaScript library that mounts a **static liquid-glass cylinder** inside any `<div>` container.

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
    radius: 0.12,
    height: 0.72,
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
- `capsule`: geometry values (`radius`, `height`, `capSegments`, `radialSegments`)
- `material`: physical glass material values (`transmission`, `ior`, `thickness`, `reflectivity`, ...)
- `background`:
  - `{ type: "gradient" }` (default)
  - `{ type: "image", imageUrl: string }`

`cylinder` options from older versions are still accepted for backward compatibility.

## Local demo

```bash
cd liquid-glass-js
npm install
npm run demo
```

Open `http://localhost:4173`.
