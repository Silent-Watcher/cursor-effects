# Cursor effects

Vite + TypeScript + Tailwind CSS v4 + GSAP.

```
npm install
npm run dev
npm run build
```

## Structure

```
src/
  main.ts                    demo entry (init effects)
  style.css                  Tailwind import and design tokens
  demo.css                   demo-only styles
  effects/
    cursor/    cursor.ts  cursor.css
    magnetic/  magnetic.ts  magnetic.css
```

## Reusing an effect in another project

1. Copy the effect folder from `src/effects/` (each folder imports its own CSS).
2. Install `gsap`.
3. Initialize it:

```ts
import { Cursor } from './effects/cursor/cursor'
import { initMagnetic } from './effects/magnetic/magnetic'

new Cursor()
initMagnetic()
```

The effect CSS files do not depend on Tailwind.

## Cursor

Options: `container` (default `document.body`), `speed` (0.7), `ease` ("expo.out"), `visibleTimeout` (300).

HTML attributes:

- `data-cursor="-lg -opaque"` adds classes to the cursor while hovering.
- `data-cursor-text="Hello"` shows text inside the cursor.
- `data-cursor-stick="#selector"` pulls the cursor to the center of that element.

Built-in state classes: `-lg`, `-opaque`, `-exclusion`, `-normal`, `-inverse`, `-hidden`.
Custom states are plain CSS, for example `.fx-cursor.-color-red { --cursor-color: red; }`.

Theme variables on `.fx-cursor`: `--cursor-color`, `--cursor-label-color`, `--cursor-size`, `--cursor-label-size`.

Methods: `setState`, `removeState`, `toggleState`, `setText`, `removeText`, `setStick`, `removeStick`, `show`, `hide`, `destroy`.

## Magnetic

```html
<div data-magnetic></div>
<div data-magnetic='{"x":0.4,"y":0.4}'></div>
```

Options: `x`, `y` (pull factor, 0.2), `s` (follow duration, 0.2), `rs` (release duration, 0.7).
Programmatic use: `new Magnetic(el, options)`, `destroy()`.
