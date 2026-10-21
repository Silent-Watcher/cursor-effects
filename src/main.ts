import './style.css'
import './demo.css'

import { Cursor } from './effects/cursor/cursor'
import { initMagnetic } from './effects/magnetic/magnetic'

// Cursor effects only make sense with a mouse; skip them on touch-only devices.
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  new Cursor()
  initMagnetic()
}
